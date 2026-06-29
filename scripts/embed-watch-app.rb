#!/usr/bin/env ruby
# Idempotently (re)adds the "Embed Watch Content" build phase to the App target so
# WilcoWatch.app actually ships INSIDE the iOS binary, and bumps the version to
# 1.0.1 (build 10) for the next submission.
#
# Why this exists: the watch target + App→Watch dependency already exist
# (add-watch-target.rb), but the embed copy-files phase went missing in the current
# project (a later widget/complication script or a `cap` regen dropped it), so the
# watch was BUILT but never BUNDLED — it didn't ship in v1.0 / build 7.
# Run from repo root:  ruby scripts/embed-watch-app.rb
require 'xcodeproj'

PROJ = 'ios/App/App.xcodeproj'
abort 'run from repo root (no ios/App/App.xcodeproj)' unless File.exist?(PROJ)

project = Xcodeproj::Project.open(PROJ)
app   = project.targets.find { |t| t.name == 'Wilco' }       or abort "no Wilco target (have: #{project.targets.map(&:name).join(', ')})"
watch = project.targets.find { |t| t.name == 'WilcoWatch' }  or abort 'no WilcoWatch target'

unless app.dependencies.any? { |d| d.target == watch }
  app.add_dependency(watch)
  puts 'App -> WilcoWatch dependency: ADDED'
end

if app.copy_files_build_phases.any? { |p| p.name == 'Embed Watch Content' }
  puts 'Embed Watch Content: already present (no change)'
else
  embed = app.new_copy_files_build_phase('Embed Watch Content')
  embed.symbol_dst_subfolder_spec = :products_directory
  embed.dst_path = '$(CONTENTS_FOLDER_PATH)/Watch'
  bf = embed.add_file_reference(watch.product_reference)
  bf.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
  puts 'Embed Watch Content: ADDED (WilcoWatch.app now bundles into App)'
end

MV = '1.0.1'
CV = '10'
project.targets.each do |t|
  t.build_configurations.each do |c|
    c.build_settings['MARKETING_VERSION']      = MV if c.build_settings.key?('MARKETING_VERSION')
    c.build_settings['CURRENT_PROJECT_VERSION'] = CV if c.build_settings.key?('CURRENT_PROJECT_VERSION')
  end
end
puts "Version -> #{MV} (build #{CV}) across all targets"

project.save
puts 'SAVED'
