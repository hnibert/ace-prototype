#!/usr/bin/env ruby
# frozen_string_literal: true

require 'yaml'
require 'fileutils'
require 'set'

ROOT = File.expand_path('..', __dir__)
CONFIG_PATH = File.join(ROOT, 'admin', 'config.yml')
OUTPUT_PATH = File.join(ROOT, 'reports', 'schema_drift_report.md')
COLLECTIONS_TO_SCAN = %w[posts people species regions communities].freeze
IGNORED_FIELDS = %w[layout slug title content body url path excerpt date categories tags id dir next previous output permalink raw].to_set
IGNORED_DUPLICATE_CONCEPT_FIELDS = %w[updated created created_at updated_at deleted deleted_at calendar_file_size].to_set
IGNORE_DUPLICATE_CONCEPT_FIELD_SUFFIXES = %w[order size count length].freeze


def normalize_name(value)
  value.to_s.strip.downcase.gsub(/[^a-z0-9]+/, '')
end


def duplicate_concept_field?(field_name)
  normalized = normalize_name(field_name)
  return true if IGNORED_DUPLICATE_CONCEPT_FIELDS.include?(normalized)
  IGNORE_DUPLICATE_CONCEPT_FIELD_SUFFIXES.any? { |suffix| normalized.end_with?(suffix) }
end


def parse_front_matter(path)
  content = File.read(path)
  if content =~ /\A---\s*\n(.*?)\n---\s*(?:\n|$)/m
    data = YAML.safe_load(Regexp.last_match(1), permitted_classes: [Date, Time], aliases: true) || {}
    data.is_a?(Hash) ? data : {}
  else
    {}
  end
rescue Psych::Exception => e
  warn "Could not parse front matter for #{path}: #{e.message}"
  {}
end


def load_collections
  data = YAML.load_file(CONFIG_PATH, aliases: true) || {}
  raw_collections = Array(data['collections'])
  raw_collections.filter_map do |item|
    next unless item.is_a?(Hash) && item['name'] && COLLECTIONS_TO_SCAN.include?(item['name'])

    {
      name: item['name'],
      folder: item['folder'],
      schema_fields: extract_schema_fields(item['fields'])
    }
  end
end


def extract_schema_fields(fields, collected = [])
  Array(fields).each do |field|
    next unless field.is_a?(Hash)

    name = field['name']
    collected << {
      'name' => name.to_s,
      'required' => field['required'] == true,
      'widget' => field['widget'].to_s,
      'multiple' => field['multiple'] == true,
      'options' => Array(field['options'])
    } if name

    nested = field['fields'] || field['types'] || []
    extract_schema_fields(nested, collected)
  end
  collected
end


def declared_type(field)
  widget = field['widget'].to_s
  return 'boolean' if widget == 'boolean'
  return 'number' if widget == 'number'
  return 'list' if widget == 'list'
  return 'hash' if widget == 'object'
  return 'list' if widget == 'relation' && field['multiple']
  return 'string' if widget == 'relation'
  return 'string' if %w[string text markdown image file datetime hidden select].include?(widget)

  'string'
end


def infer_type(value)
  case value
  when NilClass
    'null'
  when TrueClass, FalseClass
    'boolean'
  when Integer
    'integer'
  when Float
    'float'
  when Array
    'list'
  when Hash
    'hash'
  else
    'string'
  end
end


def empty_value?(value)
  value.nil? || value == '' || (value.is_a?(Array) && value.empty?) || (value.is_a?(Hash) && value.empty?)
end


def levenshtein_distance(a, b)
  return 0 if a == b
  return a.length if b.empty?
  return b.length if a.empty?

  matrix = Array.new(a.length + 1) { Array.new(b.length + 1) }
  (0..a.length).each { |i| matrix[i][0] = i }
  (0..b.length).each { |j| matrix[0][j] = j }

  (1..a.length).each do |i|
    (1..b.length).each do |j|
      cost = a[i - 1] == b[j - 1] ? 0 : 1
      matrix[i][j] = [
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      ].min
    end
  end
  matrix[a.length][b.length]
end


def collect_content_files(folder)
  return [] unless folder && Dir.exist?(File.join(ROOT, folder))

  Dir.glob(File.join(ROOT, folder, '**', '*.md')).sort
end


def schema_lookup(schema_fields)
  schema_fields.each_with_object({}) do |field, memo|
    memo[normalize_name(field['name'])] = field
  end
end

collections = load_collections
issues = {
  'inconsistent_field_names' => [],
  'inconsistent_data_types' => [],
  'missing_required_fields' => [],
  'unused_fields' => [],
  'taxonomy_inconsistencies' => [],
  'duplicate_concepts' => [],
  'recommendations' => []
}

collections.each do |collection|
  collection_name = collection[:name]
  schema_fields = collection[:schema_fields]
  schema_lookup_map = schema_lookup(schema_fields)
  files = collect_content_files(collection[:folder])

  content_fields = Hash.new { |h, k| h[k] = [] }
  content_files = []

  files.each do |file_path|
    fm = parse_front_matter(file_path)
    next if fm.empty?

    content_files << file_path
    fm.each do |raw_key, value|
      next if IGNORED_FIELDS.include?(normalize_name(raw_key))

      content_fields[raw_key.to_s] << {
        path: file_path,
        value: value,
        type: infer_type(value)
      }
    end
  end

  # Inconsistent field names
  raw_names = (schema_fields.map { |f| f['name'] } + content_fields.keys).map(&:to_s)
  normalized_groups = raw_names.each_with_object(Hash.new { |h, k| h[k] = [] }) do |name, memo|
    memo[normalize_name(name)] << name
  end

  normalized_groups.each do |normalized, names|
    next unless names.uniq.size > 1

    issues['inconsistent_field_names'] << {
      collection: collection_name,
      normalized_name: normalized,
      raw_names: names.uniq.sort
    }
  end

  # Inconsistent data types and missing required fields
  schema_fields.each do |field|
    field_name = field['name']
    normalized_field = normalize_name(field_name)
    declared = declared_type(field)
    matching_usage = content_fields.select { |raw_name, _| normalize_name(raw_name) == normalized_field }.values.flatten

    if matching_usage.empty?
      issues['unused_fields'] << {
        collection: collection_name,
        field: field_name
      }
    else
      content_types = matching_usage.map { |item| item[:type] }
      unique_types = content_types.uniq
      unless unique_types.include?(declared) || (declared == 'string' && unique_types.any? { |t| %w[string integer float boolean].include?(t) }) || (declared == 'list' && unique_types.include?('string'))
        issues['inconsistent_data_types'] << {
          collection: collection_name,
          field: field_name,
          declared_type: declared,
          observed_types: unique_types.sort
        }
      end
    end

    next unless field['required']

    content_files.each do |file_path|
      fm = parse_front_matter(file_path)
      value = fm[field_name] || fm[field_name.to_sym]
      value ||= fm.keys.find { |k| normalize_name(k) == normalized_field }&.then { |k| fm[k] }
      if empty_value?(value)
        issues['missing_required_fields'] << {
          collection: collection_name,
          file: Pathname.new(file_path).relative_path_from(Pathname.new(ROOT)).to_s,
          field: field_name
        }
      end
    end
  end

  # Taxonomy inconsistencies from select/options
  schema_fields.each do |field|
    next unless field['options'] && !field['options'].empty?

    field_name = field['name']
    normalized_field = normalize_name(field_name)
    matching_usage = content_fields.select { |raw_name, _| normalize_name(raw_name) == normalized_field }.values.flatten
    matching_usage.each do |usage|
      values = Array(usage[:value])
      values.each do |value|
        next if empty_value?(value)
        allowed = field['options'].map { |option| option.to_s }
        next if allowed.any? { |option| normalize_name(option) == normalize_name(value) }

        issues['taxonomy_inconsistencies'] << {
          collection: collection_name,
          field: field_name,
          value: value,
          allowed_values: allowed
        }
      end
    end
  end

  # Duplicate concepts represented by different values
  content_fields.each do |raw_name, usages|
    next if duplicate_concept_field?(raw_name)
    next if usages.length < 2

    values = usages.map { |u| u[:value] }.flatten.map { |v| v.to_s.strip }.reject(&:empty?)
    next if values.length < 2

    values.uniq.each_with_index do |value_a, index|
      values[(index + 1)..].each do |value_b|
        next if value_a == value_b
        next unless levenshtein_distance(value_a.downcase, value_b.downcase) <= 2

        issues['duplicate_concepts'] << {
          collection: collection_name,
          field: raw_name,
          values: [value_a, value_b].sort.uniq
        }
      end
    end
  end
end

issues['recommendations'] = []
issues['recommendations'] << 'Standardize field names to a single convention such as snake_case and align the CMS schema with the template references.' if issues['inconsistent_field_names'].any?
issues['recommendations'] << 'Normalize data types so each schema field declares a single expected type and update content to match it.' if issues['inconsistent_data_types'].any?
issues['recommendations'] << 'Fill in or relax required fields so content files can be created and edited consistently.' if issues['missing_required_fields'].any?
issues['recommendations'] << 'Remove or deprecate schema fields that are never populated in content, or wire them into the templates and content model if they are still needed.' if issues['unused_fields'].any?
issues['recommendations'] << 'Replace freeform taxonomy values with controlled vocabulary and align content values to the approved options.' if issues['taxonomy_inconsistencies'].any?
issues['recommendations'] << 'Consolidate duplicate concepts and synonyms so the same idea is represented by one canonical value.' if issues['duplicate_concepts'].any?
issues['recommendations'] << 'If the site is intended to be content-driven, add a lightweight validation step in CI or pre-commit to catch drift before it ships.' unless issues['recommendations'].any?

FileUtils.mkdir_p(File.dirname(OUTPUT_PATH))

report_lines = []
report_lines << '# Schema Drift Report'
report_lines << ''
report_lines << "- Generated: #{Time.now.strftime('%Y-%m-%d %H:%M:%S')}"
report_lines << "- Repository: #{ROOT}"
report_lines << "- Collections scanned: #{collections.map { |c| c[:name] }.join(', ')}"
report_lines << ''
report_lines << '## Summary'
report_lines << ''
report_lines << "- Inconsistent field names: #{issues['inconsistent_field_names'].size}"
report_lines << "- Inconsistent data types: #{issues['inconsistent_data_types'].size}"
report_lines << "- Missing required fields: #{issues['missing_required_fields'].size}"
report_lines << "- Unused fields: #{issues['unused_fields'].size}"
report_lines << "- Taxonomy inconsistencies: #{issues['taxonomy_inconsistencies'].size}"
report_lines << "- Duplicate concepts: #{issues['duplicate_concepts'].size}"
report_lines << ''

sections = {
  'inconsistent_field_names' => '## Inconsistent field names',
  'inconsistent_data_types' => '## Inconsistent data types',
  'missing_required_fields' => '## Missing required fields',
  'unused_fields' => '## Unused fields',
  'taxonomy_inconsistencies' => '## Taxonomy inconsistencies',
  'duplicate_concepts' => '## Duplicate concepts represented by different values',
  'recommendations' => '## Recommendations for normalizing the schema'
}

sections.each do |key, heading|
  report_lines << heading
  report_lines << ''
  if issues[key].empty?
    report_lines << '- None detected.'
  else
    issues[key].each do |item|
      case key
      when 'inconsistent_field_names'
        report_lines << "- #{item[:collection]}: normalized name '#{item[:normalized_name]}' is represented by #{item[:raw_names].join(', ')}"
      when 'inconsistent_data_types'
        report_lines << "- #{item[:collection]}: field '#{item[:field]}' is declared as #{item[:declared_type]} but observed as #{item[:observed_types].join(', ')}"
      when 'missing_required_fields'
        report_lines << "- #{item[:collection]}: #{item[:file]} is missing required field '#{item[:field]}'"
      when 'unused_fields'
        report_lines << "- #{item[:collection]}: schema field '#{item[:field]}' was never used in content"
      when 'taxonomy_inconsistencies'
        report_lines << "- #{item[:collection]}: field '#{item[:field]}' uses '#{item[:value]}' but allowed values are #{item[:allowed_values].join(', ')}"
      when 'duplicate_concepts'
        report_lines << "- #{item[:collection]}: field '#{item[:field]}' uses similar values #{item[:values].join(' | ')}"
      when 'recommendations'
        report_lines << "- #{item}"
      end
    end
  end
  report_lines << ''
end

File.write(OUTPUT_PATH, report_lines.join("\n"))
puts report_lines.join("\n")
puts ''
puts "Report written to #{OUTPUT_PATH}"
