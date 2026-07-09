# Schema Drift Report

- Generated: 2026-07-09 16:13:32
- Repository: C:/Users/jean.lee/Work/GitHub/ace-prototype
- Collections scanned: posts, people, species, regions, communities

## Summary

- Inconsistent field names: 20
- Inconsistent data types: 32
- Missing required fields: 0
- Unused fields: 28
- Taxonomy inconsistencies: 3
- Duplicate concepts: 1

## Inconsistent field names

- species: normalized name 'scientificname' is represented by scientific-name, scientific_name
- species: normalized name 'othernames' is represented by other-names, other_names
- species: normalized name 'managementstructure' is represented by management-structure, management_structure
- species: normalized name 'managementbodies' is represented by management-bodies, management_bodies
- species: normalized name 'managementbodynotes' is represented by management-body-notes, management_body_notes
- species: normalized name 'cdqgroups' is represented by cdq-groups, cdq_groups
- species: normalized name 'cdqcommunities' is represented by cdq-communities, cdq_communities
- species: normalized name 'ccvlabel' is represented by ccv-label, ccv_label
- species: normalized name 'ccvreference' is represented by ccv-reference, ccv_reference
- species: normalized name 'ccvscore' is represented by ccv-score, ccv_score
- species: normalized name 'ccvnotes' is represented by ccv-notes, ccv_notes
- species: normalized name 'protectionnotes' is represented by protection-notes, protection_notes
- species: normalized name 'justificationnotes' is represented by justification-notes, justification_notes
- species: normalized name 'culturalsignificance' is represented by cultural-significance, cultural_significance
- species: normalized name 'culturalsignificancenotes' is represented by cultural-significance-notes, cultural_significance_notes
- species: normalized name 'spatialdata' is represented by spatial-data, spatial_data
- species: normalized name 'spatialdatanotes' is represented by spatial-data-notes, spatial_data_notes
- regions: normalized name 'herodata' is represented by hero_Data, hero_data
- communities: normalized name 'showinfobar' is represented by show-info-bar, show_info_bar
- communities: normalized name 'herodata' is represented by hero_Data, hero_data

## Inconsistent data types

- posts: field 'series_order' is declared as number but observed as integer, null
- posts: field 'description' is declared as string but observed as null
- people: field 'research_areas' is declared as string but observed as list
- people: field 'bluesky' is declared as string but observed as null
- people: field 'feature_order' is declared as number but observed as integer, null
- species: field 'img_url' is declared as string but observed as null
- species: field 'img_alt' is declared as string but observed as null
- species: field 'scientific_name' is declared as string but observed as null
- species: field 'other_names' is declared as string but observed as null
- species: field 'management_structure' is declared as string but observed as null
- species: field 'management_body_notes' is declared as string but observed as null
- species: field 'ccv_label' is declared as string but observed as null
- species: field 'ccv_reference' is declared as string but observed as null
- species: field 'ccv_score' is declared as number but observed as null
- species: field 'ccv_notes' is declared as string but observed as null
- species: field 'communities' is declared as string but observed as list, null
- species: field 'protections' is declared as string but observed as null
- species: field 'protection_notes' is declared as string but observed as null
- species: field 'justification' is declared as string but observed as null
- species: field 'justification_notes' is declared as string but observed as null
- species: field 'cultural_significance' is declared as string but observed as null
- species: field 'cultural_significance_notes' is declared as string but observed as null
- species: field 'spatial_data' is declared as string but observed as null
- species: field 'spatial_data_notes' is declared as string but observed as null
- species: field 'references' is declared as list but observed as null
- regions: field 'summary_img_alt' is declared as string but observed as null
- regions: field 'display_order' is declared as number but observed as integer
- communities: field 'native_pronunciation_audio' is declared as string but observed as null
- communities: field 'summary_img_alt' is declared as string but observed as null
- communities: field 'calendar_card_img_alt' is declared as string but observed as null
- communities: field 'calendar_display_alt' is declared as string but observed as null
- communities: field 'display_order' is declared as number but observed as integer

## Missing required fields

- None detected.

## Unused fields

- posts: schema field 'layout' was never used in content
- posts: schema field 'title' was never used in content
- posts: schema field 'date' was never used in content
- posts: schema field 'categories' was never used in content
- posts: schema field 'title' was never used in content
- posts: schema field 'url' was never used in content
- posts: schema field 'body' was never used in content
- people: schema field 'layout' was never used in content
- people: schema field 'title' was never used in content
- people: schema field 'role' was never used in content
- people: schema field 'featured' was never used in content
- people: schema field 'body' was never used in content
- species: schema field 'layout' was never used in content
- species: schema field 'tags' was never used in content
- regions: schema field 'layout' was never used in content
- regions: schema field 'id' was never used in content
- regions: schema field 'is_header' was never used in content
- regions: schema field 'img_url' was never used in content
- regions: schema field 'img_alt' was never used in content
- regions: schema field 'title' was never used in content
- regions: schema field 'lead' was never used in content
- communities: schema field 'layout' was never used in content
- communities: schema field 'id' was never used in content
- communities: schema field 'is_header' was never used in content
- communities: schema field 'img_url' was never used in content
- communities: schema field 'img_alt' was never used in content
- communities: schema field 'title' was never used in content
- communities: schema field 'lead' was never used in content

## Taxonomy inconsistencies

- people: field 'research_areas' uses 'Social Science' but allowed values are Fisheries Management, Ecology, Modeling, Stock Assessment, Fishing Communities, Climate Science, Communications, Social Sciene, Ecosystem-based Research, Oceanography, Communications
- people: field 'research_areas' uses 'Social Science' but allowed values are Fisheries Management, Ecology, Modeling, Stock Assessment, Fishing Communities, Climate Science, Communications, Social Sciene, Ecosystem-based Research, Oceanography, Communications
- people: field 'research_areas' uses 'Social Science' but allowed values are Fisheries Management, Ecology, Modeling, Stock Assessment, Fishing Communities, Climate Science, Communications, Social Sciene, Ecosystem-based Research, Oceanography, Communications

## Duplicate concepts represented by different values

- people: field 'projects' uses similar values {"title" => "Alaska Climate Integrated Modeling (ACLIM)", "role" => "Lead Principal Investigator"} | {"title" => "Alaska Climate Integrated Modeling (ACLIM)", "role" => "Lead Principle Investigator"}

## Recommendations for normalizing the schema

- Standardize field names to a single convention such as snake_case and align the CMS schema with the template references.
- Normalize data types so each schema field declares a single expected type and update content to match it.
- Remove or deprecate schema fields that are never populated in content, or wire them into the templates and content model if they are still needed.
- Replace freeform taxonomy values with controlled vocabulary and align content values to the approved options.
- Consolidate duplicate concepts and synonyms so the same idea is represented by one canonical value.
