#!/usr/bin/env ruby
# Adds the WilcoWatch watchOS app target to ios/App/App.xcodeproj and embeds it
# in the iOS App. Reconstructs ios/App/WilcoWatch/ from the committed sources
# (watch-app/Sources + watch-app/ios-template), so it's fully repeatable after a
# fresh `npx cap add ios`. Idempotent: bails if the target already exists.
# Run from repo root:  ruby scripts/add-watch-target.rb
require 'xcodeproj'
require 'fileutils'

PROJ = 'ios/App/App.xcodeproj'
TEAM = 'CCSWC89S2V'
WATCH_BUNDLE = 'com.binnacleai.radiocoach.watchkitapp'
DEST = 'ios/App/WilcoWatch'

abort 'run from repo root (no ios/App/App.xcodeproj)' unless File.exist?(PROJ)

# 1. Stage the watch files into ios/App/WilcoWatch from the committed sources.
FileUtils.mkdir_p(DEST)
Dir['watch-app/Sources/*.swift'].each { |f| FileUtils.cp(f, DEST) }
FileUtils.cp('watch-app/ios-template/Info.plist', DEST)
FileUtils.rm_rf("#{DEST}/Assets.xcassets")
FileUtils.cp_r('watch-app/ios-template/Assets.xcassets', DEST)

project = Xcodeproj::Project.open(PROJ)
app = project.targets.find { |t| t.name == 'App' } or abort 'no App target'
if project.targets.any? { |t| t.name == 'WilcoWatch' }
  puts 'WilcoWatch target already present — files restaged, project unchanged.'
  exit 0
end

watch = project.new_target(:application, 'WilcoWatch', :watchos, '9.0')

grp = project.main_group.new_group('WilcoWatch', 'WilcoWatch')
%w[WilcoWatchApp.swift Drills.swift DrillViews.swift].each do |f|
  watch.add_file_references([grp.new_reference(f)])
end
grp.new_reference('Info.plist')
watch.add_resources([grp.new_reference('Assets.xcassets')])

watch.build_configurations.each do |c|
  s = c.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER'] = WATCH_BUNDLE
  s['PRODUCT_NAME'] = '$(TARGET_NAME)'
  s['INFOPLIST_FILE'] = 'WilcoWatch/Info.plist'
  s['GENERATE_INFOPLIST_FILE'] = 'NO'
  s['SDKROOT'] = 'watchos'
  s['TARGETED_DEVICE_FAMILY'] = '4'
  s['WATCHOS_DEPLOYMENT_TARGET'] = '9.0'
  s['SWIFT_VERSION'] = '5.0'
  s['DEVELOPMENT_TEAM'] = TEAM
  s['CODE_SIGN_STYLE'] = 'Automatic'
  s['MARKETING_VERSION'] = '1.0'
  s['CURRENT_PROJECT_VERSION'] = '6'
  s['ASSETCATALOG_COMPILER_APPICON_NAME'] = 'AppIcon'
  s['ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME'] = 'AccentColor'
  s['SKIP_INSTALL'] = 'NO'
  s['ENABLE_PREVIEWS'] = 'YES'
end

# iOS app embeds + depends on the watch app
app.add_dependency(watch)
embed = app.new_copy_files_build_phase('Embed Watch Content')
embed.symbol_dst_subfolder_spec = :products_directory
embed.dst_path = '$(CONTENTS_FOLDER_PATH)/Watch'
bf = embed.add_file_reference(watch.product_reference)
bf.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

project.save

# Shared scheme so `xcodebuild -scheme WilcoWatch` works
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(watch)
scheme.set_launch_target(watch)
scheme.save_as(PROJ, 'WilcoWatch', true)

puts 'DONE: WilcoWatch target added + embedded in App.'
