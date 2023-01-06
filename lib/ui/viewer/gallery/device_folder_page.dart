import 'package:flutter/material.dart';
import 'package:logging/logging.dart';
import 'package:photos/core/configuration.dart';
import 'package:photos/core/event_bus.dart';
import 'package:photos/db/device_files_db.dart';
import 'package:photos/db/files_db.dart';
import 'package:photos/events/files_updated_event.dart';
import 'package:photos/events/local_photos_updated_event.dart';
import 'package:photos/models/device_collection.dart';
import 'package:photos/models/gallery_type.dart';
import 'package:photos/models/selected_files.dart';
import 'package:photos/services/remote_sync_service.dart';
import 'package:photos/theme/ente_theme.dart';
import 'package:photos/ui/components/captioned_text_widget.dart';
import 'package:photos/ui/components/menu_item_widget.dart';
import 'package:photos/ui/components/menu_section_description_widget.dart';
import 'package:photos/ui/components/toggle_switch_widget.dart';
import 'package:photos/ui/viewer/actions/file_selection_overlay_bar.dart';
import 'package:photos/ui/viewer/gallery/gallery.dart';
import 'package:photos/ui/viewer/gallery/gallery_app_bar_widget.dart';

class DeviceFolderPage extends StatelessWidget {
  final DeviceCollection deviceCollection;
  final _selectedFiles = SelectedFiles();

  DeviceFolderPage(this.deviceCollection, {Key? key}) : super(key: key);

  @override
  Widget build(Object context) {
    final gallery = Gallery(
      asyncLoader: (creationStartTime, creationEndTime, {limit, asc}) {
        return FilesDB.instance.getFilesInDeviceCollection(
          deviceCollection,
          creationStartTime,
          creationEndTime,
          limit: limit,
          asc: asc,
        );
      },
      reloadEvent: Bus.instance.on<LocalPhotosUpdatedEvent>(),
      removalEventTypes: const {
        EventType.deletedFromDevice,
        EventType.deletedFromEverywhere,
        EventType.hide,
      },
      tagPrefix: "device_folder:" + deviceCollection.name,
      selectedFiles: _selectedFiles,
      header: Configuration.instance.hasConfiguredAccount()
          ? BackupHeaderWidget(deviceCollection)
          : const SizedBox.shrink(),
      initialFiles: [deviceCollection.thumbnail!],
    );
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(50.0),
        child: GalleryAppBarWidget(
          GalleryType.localFolder,
          deviceCollection.name,
          _selectedFiles,
          deviceCollection: deviceCollection,
        ),
      ),
      body: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          gallery,
          FileSelectionOverlayBar(
            GalleryType.localFolder,
            _selectedFiles,
          )
        ],
      ),
    );
  }
}

class BackupHeaderWidget extends StatelessWidget {
  final DeviceCollection deviceCollection;

  const BackupHeaderWidget(this.deviceCollection, {super.key});

  @override
  Widget build(BuildContext context) {
    bool shouldBackup = deviceCollection.shouldBackup;
    final colorScheme = getEnteColorScheme(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              MenuItemWidget(
                captionedTextWidget: const CaptionedTextWidget(title: "Backup"),
                menuItemColor: colorScheme.fillFaint,
                alignCaptionedTextToLeft: true,
                trailingWidget: ToggleSwitchWidget(
                  value: () => shouldBackup,
                  onChanged: () async {
                    await RemoteSyncService.instance
                        .updateDeviceFolderSyncStatus(
                      {deviceCollection.id: !shouldBackup},
                    ).then(
                      (value) => shouldBackup = !shouldBackup,
                      onError: (e) {
                        Logger("BackupHeaderWidget").severe(
                          "Could not update device folder sync status",
                        );
                      },
                    );
                  },
                ),
              ),
              const MenuSectionDescriptionWidget(
                content:
                    "Turn on backup to automatically upload files added to this device folder to ente.",
              )
            ],
          ),
        ],
      ),
    );
  }
}
