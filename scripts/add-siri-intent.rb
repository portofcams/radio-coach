#!/usr/bin/env ruby
# Adds the Siri App Shortcut (siri/Sources/WilcoShortcuts.swift) to the main App
# target. App Shortcuts are zero-config on iOS 16+, so this just drops the Swift
# file into the App target's source group. Idempotent. Run from repo root:
#   ruby scripts/add-siri-intent.rb
require 'xcodeproj'
require 'fileutils'

PROJ = 'ios/App/App.xcodeproj'
SRC = 'siri/Sources/WilcoShortcuts.swift'
abort 'run from repo root (no ios/App/App.xcodeproj)' unless File.exist?(PROJ)

# Stage next to AppDelegate.swift (ios/App/App/).
FileUtils.cp(SRC, 'ios/App/App/WilcoShortcuts.swift')

project = Xcodeproj::Project.open(PROJ)
app = project.targets.find { |t| t.name == 'App' } or abort 'no App target'

already = project.files.any? { |f| f.path&.end_with?('WilcoShortcuts.swift') }
if already
  puts 'WilcoShortcuts.swift already in the project — file restaged.'
  exit 0
end

# Put it in the same group as AppDelegate.swift.
delegate = project.files.find { |f| f.path&.end_with?('AppDelegate.swift') } or abort 'no AppDelegate.swift'
grp = delegate.parent
ref = grp.new_reference('WilcoShortcuts.swift')
app.add_file_references([ref])
project.save
puts 'DONE: WilcoShortcuts.swift added to the App target.'
