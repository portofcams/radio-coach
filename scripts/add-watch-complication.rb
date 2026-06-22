#!/usr/bin/env ruby
# Adds the WilcoComplication watchOS WidgetKit extension and embeds it in the
# WilcoWatch app (PlugIns). Requires the watch target — run add-watch-target.rb
# first. Reconstructs ios/App/WilcoComplication/ from the committed sources.
# Idempotent. Run from repo root: ruby scripts/add-watch-complication.rb
require 'xcodeproj'
require 'fileutils'

PROJ = 'ios/App/App.xcodeproj'
TEAM = 'CCSWC89S2V'
BUNDLE = 'com.binnacleai.radiocoach.watchkitapp.complication'
DEST = 'ios/App/WilcoComplication'
abort 'run from repo root (no ios/App/App.xcodeproj)' unless File.exist?(PROJ)

FileUtils.mkdir_p(DEST)
Dir['watch-complication/Sources/*.swift'].each { |f| FileUtils.cp(f, DEST) }
FileUtils.cp('watch-complication/ios-template/Info.plist', DEST)
FileUtils.rm_rf("#{DEST}/Assets.xcassets")
FileUtils.cp_r('watch-complication/ios-template/Assets.xcassets', DEST)

project = Xcodeproj::Project.open(PROJ)
watch = project.targets.find { |t| t.name == 'WilcoWatch' } or abort 'no WilcoWatch target — run add-watch-target.rb first'
if project.targets.any? { |t| t.name == 'WilcoComplication' }
  puts 'WilcoComplication already present — files restaged.'
  exit 0
end

comp = project.new_target(:app_extension, 'WilcoComplication', :watchos, '9.0')
grp = project.main_group.new_group('WilcoComplication', 'WilcoComplication')
Dir['watch-complication/Sources/*.swift'].each { |f| comp.add_file_references([grp.new_reference(File.basename(f))]) }
grp.new_reference('Info.plist')
comp.add_resources([grp.new_reference('Assets.xcassets')])

comp.build_configurations.each do |c|
  s = c.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER'] = BUNDLE
  s['PRODUCT_NAME'] = '$(TARGET_NAME)'
  s['INFOPLIST_FILE'] = 'WilcoComplication/Info.plist'
  s['GENERATE_INFOPLIST_FILE'] = 'NO'
  s['SDKROOT'] = 'watchos'
  s['TARGETED_DEVICE_FAMILY'] = '4'
  s['WATCHOS_DEPLOYMENT_TARGET'] = '9.0'
  s['SWIFT_VERSION'] = '5.0'
  s['DEVELOPMENT_TEAM'] = TEAM
  s['CODE_SIGN_STYLE'] = 'Automatic'
  s['MARKETING_VERSION'] = '1.0'
  s['CURRENT_PROJECT_VERSION'] = '6'
  s['ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME'] = 'AccentColor'
  s['SKIP_INSTALL'] = 'NO'
  s['LD_RUNPATH_SEARCH_PATHS'] = '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks'
end

# Embed in the WATCH app (PlugIns) + depend on it.
watch.add_dependency(comp)
embed = watch.new_copy_files_build_phase('Embed Foundation Extensions')
embed.symbol_dst_subfolder_spec = :plug_ins
bf = embed.add_file_reference(comp.product_reference)
bf.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(comp)
scheme.save_as(PROJ, 'WilcoComplication', true)
puts 'DONE: WilcoComplication added + embedded in WilcoWatch.'
