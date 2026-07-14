#!/usr/bin/env ruby
# Adds Native/Audio/SpeechFallbackPlayer.swift to the Wilco target's source
# group, next to RadioPlayer.swift. Idempotent. Run from repo root:
#   ruby scripts/add-speech-fallback-player.rb
require 'xcodeproj'

PROJ = 'ios/App/App.xcodeproj'
abort 'run from repo root (no ios/App/App.xcodeproj)' unless File.exist?(PROJ)

project = Xcodeproj::Project.open(PROJ)
target = project.targets.find { |t| t.name == 'Wilco' } or abort 'no Wilco target'

already = project.files.any? { |f| f.path&.end_with?('SpeechFallbackPlayer.swift') }
if already
  puts 'SpeechFallbackPlayer.swift already in the project.'
  exit 0
end

radio_player = project.files.find { |f| f.path&.end_with?('RadioPlayer.swift') } or abort 'no RadioPlayer.swift reference'
# Groups here don't mirror the on-disk folder structure — file refs store their
# full relative path (e.g. RadioPlayer.swift's ref path is "Native/Audio/RadioPlayer.swift"),
# all parented directly under the top-level "App" group. Match that exactly.
grp = radio_player.parent
ref = grp.new_reference('Native/Audio/SpeechFallbackPlayer.swift')
target.add_file_references([ref])
project.save
puts 'DONE: SpeechFallbackPlayer.swift added to the Wilco target.'
