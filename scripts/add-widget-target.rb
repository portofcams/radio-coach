#!/usr/bin/env ruby
# Adds the WilcoWidget WidgetKit extension to ios/App/App.xcodeproj and embeds it
# in the iOS App (PlugIns). Reconstructs ios/App/WilcoWidget/ from the committed
# sources (widget/Sources + widget/ios-template), so it's repeatable after a fresh
# `npx cap add ios`. Idempotent: bails if the target already exists.
# Run from repo root:  ruby scripts/add-widget-target.rb
require 'xcodeproj'
require 'fileutils'

PROJ = 'ios/App/App.xcodeproj'
TEAM = 'CCSWC89S2V'
BUNDLE = 'com.binnacleai.radiocoach.widget'
DEST = 'ios/App/WilcoWidget'

abort 'run from repo root (no ios/App/App.xcodeproj)' unless File.exist?(PROJ)

# 1. Stage the widget files from the committed sources.
FileUtils.mkdir_p(DEST)
Dir['widget/Sources/*.swift'].each { |f| FileUtils.cp(f, DEST) }
FileUtils.cp('widget/ios-template/Info.plist', DEST)
FileUtils.rm_rf("#{DEST}/Assets.xcassets")
FileUtils.cp_r('widget/ios-template/Assets.xcassets', DEST)

project = Xcodeproj::Project.open(PROJ)
app = project.targets.find { |t| t.name == 'App' } or abort 'no App target'
if project.targets.any? { |t| t.name == 'WilcoWidget' }
  puts 'WilcoWidget target already present — files restaged, project unchanged.'
  exit 0
end

widget = project.new_target(:app_extension, 'WilcoWidget', :ios, '16.0')

grp = project.main_group.new_group('WilcoWidget', 'WilcoWidget')
Dir['widget/Sources/*.swift'].each { |f| widget.add_file_references([grp.new_reference(File.basename(f))]) }
grp.new_reference('Info.plist')
widget.add_resources([grp.new_reference('Assets.xcassets')])

widget.build_configurations.each do |c|
  s = c.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER'] = BUNDLE
  s['PRODUCT_NAME'] = '$(TARGET_NAME)'
  s['INFOPLIST_FILE'] = 'WilcoWidget/Info.plist'
  s['GENERATE_INFOPLIST_FILE'] = 'NO'
  s['SDKROOT'] = 'iphoneos'
  s['TARGETED_DEVICE_FAMILY'] = '1,2'
  s['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
  s['SWIFT_VERSION'] = '5.0'
  s['DEVELOPMENT_TEAM'] = TEAM
  s['CODE_SIGN_STYLE'] = 'Automatic'
  s['MARKETING_VERSION'] = '1.0'
  s['CURRENT_PROJECT_VERSION'] = '6'
  s['ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME'] = 'AccentColor'
  s['ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME'] = 'WidgetBackground'
  s['SKIP_INSTALL'] = 'NO'
  s['LD_RUNPATH_SEARCH_PATHS'] = '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks'
end

# iOS app embeds + depends on the widget extension (PlugIns folder).
app.add_dependency(widget)
embed = app.new_copy_files_build_phase('Embed Foundation Extensions')
embed.symbol_dst_subfolder_spec = :plug_ins
bf = embed.add_file_reference(widget.product_reference)
bf.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

project.save

scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(widget)
scheme.save_as(PROJ, 'WilcoWidget', true)

puts 'DONE: WilcoWidget target added + embedded in App.'
