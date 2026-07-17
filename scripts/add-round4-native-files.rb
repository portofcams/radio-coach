#!/usr/bin/env ruby
# Registers the 2026-07-17 native files with their Xcode targets. Idempotent.
# Run from repo root:
#   ruby scripts/add-round4-native-files.rb
#
# Why this exists: swiftc -typecheck over an explicit file list does NOT prove
# a file is in the target's Compile Sources — it bypasses project.pbxproj
# entirely. These 8 files typechecked clean while being invisible to a real
# xcodebuild, which would have failed on the FIRST reference from an
# already-registered file (TrainHubView calls ReferralView/FlashcardsView).
# Same class of bug as the Watch app that compiled but never embedded --
# see scripts/embed-watch-app.rb's header.
require 'xcodeproj'

PROJ = 'ios/App/App.xcodeproj'
abort 'run from repo root (no ios/App/App.xcodeproj)' unless File.exist?(PROJ)

project = Xcodeproj::Project.open(PROJ)

# [ref path, target, anchor sibling]
#
# CRITICAL (learned the hard way — a first pass used File.basename here and
# silently produced refs pointing at ios/App/App/Referral.swift, which does
# not exist): groups in this project do NOT mirror on-disk folders. Every
# Wilco source ref lives directly under the top-level "App" group and carries
# its FULL path relative to that group, e.g. "Native/Audio/RadioPlayer.swift".
# WilcoWidget files sit directly in WilcoWidget/, so those are bare basenames.
# Matches scripts/add-speech-fallback-player.rb exactly.
ADDITIONS = [
  # #94 -- CFI ambassador + referral leaderboard, native port
  ['Native/Models/Referral.swift',                    'Wilco', 'UserStats.swift'],
  ['Native/Profile/ReferralViewModel.swift',          'Wilco', 'ProfileStatsViewModel.swift'],
  ['Native/Profile/ReferralView.swift',               'Wilco', 'ProfileStatsView.swift'],
  ['Native/Profile/ReferralLeaderboardView.swift',    'Wilco', 'ProfileStatsView.swift'],
  # #99 -- accessibility settings
  ['Native/Profile/AccessibilitySettings.swift',      'Wilco', 'ProfileView.swift'],
  # #98 -- phone-side flashcards (Watch handoff target)
  ['Native/Practice/FlashcardsView.swift',            'Wilco', 'PracticeView.swift'],
  # #97 -- Live Activity attributes (app side starts/updates/ends it)
  ['Native/Scenario/ScenarioActivityAttributes.swift', 'Wilco', 'ScenarioViewModel.swift'],
  # #97 -- widget-extension side: renders the activity + its own attrs copy
  ['ScenarioActivityAttributes.swift',                'WilcoWidget', 'Tips.swift'],
  ['ScenarioLiveActivity.swift',                      'WilcoWidget', 'WilcoWidget.swift'],
].freeze

# ref path -> where the file actually lives, for the on-disk existence check.
DISK_PREFIX = { 'Wilco' => 'ios/App/App', 'WilcoWidget' => 'ios/App/WilcoWidget' }.freeze

added = 0
ADDITIONS.each do |path, target_name, sibling_name|
  basename = File.basename(path)

  target = project.targets.find { |t| t.name == target_name }
  abort "no #{target_name} target" unless target

  # Already registered in THIS target's compile sources?
  in_target = target.source_build_phase.files.any? do |bf|
    bf.file_ref&.path&.end_with?(basename)
  end
  if in_target
    puts "  = #{basename} already in #{target_name}"
    next
  end

  disk_path = File.join(DISK_PREFIX.fetch(target_name), path)
  abort "missing on disk: #{disk_path}" unless File.exist?(disk_path)

  sibling = project.files.find { |f| f.path&.end_with?(sibling_name) }
  abort "no anchor #{sibling_name} to place #{basename} next to" unless sibling
  group = sibling.parent

  # Reuse an existing ref if another target already added this exact path.
  ref = project.files.find { |f| f.path == path && f.parent == group }
  ref ||= group.new_reference(path)

  target.add_file_references([ref])
  puts "  + #{path} -> #{target_name} (group: #{group.display_name})"
  added += 1
end

project.save

# Verify every ref resolves to a real file — the whole point of this script is
# to avoid silently-broken refs, so prove it rather than assume it.
puts "\nVerifying refs resolve on disk:"
broken = 0
reopened = Xcodeproj::Project.open(PROJ)
ADDITIONS.each do |path, _target, _anchor|
  ref = reopened.files.find { |f| f.path == path }
  unless ref
    puts "  BROKEN  #{path} — no ref found"
    broken += 1
    next
  end
  real = ref.real_path.to_s
  if File.exist?(real)
    puts "  ok      #{path}"
  else
    puts "  BROKEN  #{path} -> #{real} (does not exist)"
    broken += 1
  end
end
abort "\n#{broken} ref(s) do not resolve — fix before building." if broken.positive?

puts added.zero? ? "\nNothing to add — already registered." : "\nRegistered #{added} file(s); all refs resolve."
