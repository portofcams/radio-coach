#!/usr/bin/env ruby
# Registers the pre-rendered scenario/listen/oral audio clips
# (Native/Resources/audio/{scenario,listen,oral}/*.mp3) with the Wilco target's
# Resources build phase. Idempotent — skips files already registered. Run from
# repo root:
#   ruby scripts/add-bundled-audio.rb
require 'xcodeproj'
require 'set'

PROJ = 'ios/App/App.xcodeproj'
AUDIO_DIR = 'ios/App/App/Native/Resources/audio'
abort 'run from repo root (no ios/App/App.xcodeproj)' unless File.exist?(PROJ)

project = Xcodeproj::Project.open(PROJ)
target = project.targets.find { |t| t.name == 'Wilco' } or abort 'no Wilco target'

# Same flat-group pattern as the chart PNGs: parent directly under "App",
# full relative path stored on the file reference itself.
sample_png = project.files.find { |f| f.path&.include?('charts') } or abort 'no reference chart file found'
grp = sample_png.parent

existing = project.files.map(&:path).compact.to_set
added = 0
skipped = 0

Dir.glob("#{AUDIO_DIR}/**/*.mp3").sort.each do |disk_path|
  rel_path = disk_path.sub(%r{^ios/App/App/}, '')
  if existing.include?(rel_path)
    skipped += 1
    next
  end
  ref = grp.new_reference(rel_path)
  target.add_resources([ref])
  added += 1
end

project.save
puts "DONE: added #{added}, already present #{skipped}."
