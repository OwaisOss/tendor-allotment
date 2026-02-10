import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from "react-native-permissions";
import { Alert, Platform } from "react-native";
import { isIos } from "./constants";

const mobilesAndroidVersion = Platform.constants.Release;

const REQUEST_PERMISSION_TYPE = {
  // camera: isIos()
  //   ? // Platform.OS === 'ios'
  //     PERMISSIONS.IOS.CAMERA
  //   : PERMISSIONS.ANDROID.CAMERA,
  mediaGallery: isIos()
    ? PERMISSIONS.IOS.PHOTO_LIBRARY
    : mobilesAndroidVersion > 12
    ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
    : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
  writeMedia: PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
  pushNotification: PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
};

export const PERMISSION_TYPE = {
  // camera: "camera",
  //  location: 'location',
  mediaGallery: "mediaGallery",
  writeMedia: "writeMedia",
  pushNotification: "pushNotification",
};

const checkPermission = async (type, message) => {
  const permissions = REQUEST_PERMISSION_TYPE[type];
  try {
    const result = await check(permissions);
    if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
      return true;
    } else {
      const res = await requestPermission(permissions, message);
      return res === true;
    }
  } catch (e) {
    console.log("checkPermission e1 :", e);
    throw e;
  }
};

const requestPermission = async (permissions, message) => {
  try {
    const result = await request(permissions);
    if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
      return true;
    } else if (result === RESULTS.BLOCKED) {
      Alert.alert("Permission Blocked ", message, [
        {
          text: "Cancel",
          onPress: () => null,
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () =>
            openSettings().catch(() => console.warn("cannot open settings")),
        },
      ]);
    } else if (result === RESULTS.DENIED) {
      Alert.alert(
        "Permission Denied",
        "Please provide us permissions for better user experience",
        [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel",
          },
        ]
      );
    }
  } catch (e) {
    console.log("error in permission", e);
    throw e;
  }
};

export default checkPermission;
