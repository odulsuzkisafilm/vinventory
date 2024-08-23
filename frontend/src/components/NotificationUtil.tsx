import { notification } from "antd";

class NotificationUtil {
  static showSuccessNotification(item: string) {
    notification.success({
      message: "Operation Successful",
      description: `${item} was successfully added.`,
      placement: "bottomRight",
    });
  }

  static showFailNotification(item: string) {
    notification.error({
      message: "Operation Failed",
      description: `${item} could not be added.`,
      placement: "bottomRight",
    });
  }
}

export default NotificationUtil;
