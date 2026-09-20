export const SERVICE_NAME = process.env.SERVICE_NAME || "ADMIN";

export enum USER_TYPE {
  ADMIN = "ADMIN",
  USER = "USER",
  SUB_ADMIN = "SUB_ADMIN",
}
export const STATUS = {
  INACTIVE: "INACTIVE",
  ACTIVE: "ACTIVE",
  DELETED: "DELETED",
  BLOCKED: "BLOCKED",
};
export const SALT_ROUNDS = 10;
export const OTP_EXPIRY = 180;

// export const AWS_SECRET_MANGER = {
//   REGION: 'us-east-1',
//   SECRET_NAME: `clearlink-${process.env['NODE_ENV']}`,
// };
export const AWS_SECRET_MANGER = {
  REGION: `${process.env["AWS_DEFAULT_REGION"]}`,
  SECRET_NAME: `${process.env["AWS_SECRETS"]}`,
};

// export enum DEVICE_TYPE {
//   ANDROID = 'a',
//   IOS = 'i',
//   WEB = 'w',
// }

export const LANGUAGES = ["en", "ar"];

export const VALIDATION_CRITERIA = {
  FIRST_NAME_MIN_LENGTH: 3,
  FIRST_NAME_MAX_LENGTH: 10,
  MIDDLE_NAME_MIN_LENGTH: 3,
  MIDDLE_NAME_MAX_LENGTH: 10,
  LAST_NAME_MIN_LENGTH: 3,
  LAST_NAME_MAX_LENGTH: 10,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  COUNTRY_CODE_MIN_LENGTH: 1,
  COUNTRY_CODE_MAX_LENGTH: 5,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 20,
  PHONE_NO_MAX_LENGTH: 13,
  PHONE_NO_MIN_LENGTH: 5,
  LATITUDE_MIN_VALUE: -90,
  LATITUDE_MAX_VALUE: 90,
  LONGITUDE_MIN_VALUE: -180,
  LONGITUDE_MAX_VALUE: 180,
  TITLE_MAX_VALUE: 50,
  DESCRIPTION_MAX_VALUE: 200,
};

export const VALIDATION_MESSAGE = {
  CONFIRM_PASSWORD_REQUIRED: "Please provide confirm password.",
  INVALID_EMAIL_ADDRESS: "Invalid Email",
  INVALID_NAME: "Please enter a valid name.",
  INVALID_PASSWORD:
    "Password must be 8 characters long, an uppercase letter, a lowercase letter, a number, and a special character.",
  INVALID_PHONE_NO: "Please enter a valid phone number.",
  INVALID_STATUS: "Please choose a status of either active, inactive",
  NEW_PASSWORD_REQUIRED: "Please provide new password.",
  OLD_PASSWORD_REQUIRED: "Please provide old password.",
  MAX_INTEREST_CHOOSE: "Maximum interests limit of 12 has reached",
  INVALID_MEDIA: "Please choose a media of either Video,Document,Link",
  MIN_INTEREST_CHOOSE:
    "To proceed, please ensure that you have selected a minimum of one interest",
  INVALID_ROLE_NAME: "Please enter a valid role name.",
};

export const TOKEN_TYPE = {
  USER_LOGIN: "USER_LOGIN", // login/signup
  ADMIN_LOGIN: "ADMIN_LOGIN",
  OTP_VERIFY: "OTP_VERIFY",
  FORGOT_EMAIL: "FORGOT_EMAIL",
};

export const EMAIL_TEMPLATE = {
  TITLE: "User",
  SUBJECT: {
    FORGOT_PASSWORD: "Reset Password Request",
    ACCOUNT_CREATED: "Account Created",
  },
  TEXT: {
    FORGOT_PASSWORD: "Your OTP to reset password is ",
    ACCOUNT_CREATED:
      "Your account has been created. Please use following credentials to login: ",
  },
  BCC_MAIL: ["shivam.wadhwa@appinventiv.com"],
  FROM_MAIL: "shivam.wadhwa@appinventiv.com",
  TEMPLATE: {
    EMAIL_VERIFICATION: "admin-forgot-password.html",
    SUB_ADMIN_ADDED: "subAdminAdded.html",
    SUB_ADMIN_UPDATED: "subAdminRoleUpdate.html",
  },
};

export const MAIL_SENDING_TYPE = {
  SENDGRID: 1,
  SMTP: 2,
  AMAZON: 3,
};
export const userType = ["ADMIN", "USER", "SUB_ADMIN"];

export const REGEX = {
  SEARCH: /[-[\]/{}()*+?.\\^$|]/g,
  PHONE_VALIDATION:
    /^(?=(?:\D*\d){7,20}\D*$)\+?[0-9]{1,4}?(?:[-.\s]?\(?\d{1,4}\)?)(?:[-.\s]?\d{2,})+$/,
  CONCERN_NAME_ENGLISH: /^[A-Za-z0-9& ]+$/,
  CONCERN_NAME_ARABIC: /^[\u0600-\u06FF\u0660-\u0669& ]+$/,
};

export const UUID_TYPE = {
  QUEST_ID: "QID",
  COURSE_ID: "CID",
  QUESTION_ID: "QAID",
  AVATAR_ID: "AID",
  FEEDBACK_ID: "FID",
};

export enum MODULES {
  DASHBOARD = "DASHBOARD",
  USER_MANAGEMENT = "USER_MANAGEMENT",
  PAYMENTS_AND_SUBSCRIPTIONS = "PAYMENTS_AND_SUBSCRIPTIONS",
  QUEST_MANAGEMENT = "QUEST_MANAGEMENT",
  AVATAR_MANAGEMENT = "AVATAR_MANAGEMENT",
  FEEDBACK_MANAGEMENT = "FEEDBACK_MANAGEMENT",
  CMS_MANAGEMENT = "CMS_MANAGEMENT",
  NOTIFICATION_MANAGEMENT = "NOTIFICATION_MANAGEMENT",
}

export const queryType = {
  FEEDBACK: "FEEDBACK",
  ENQUIRY: "ENQUIRY",
  COMPLAINT: "COMPLAINT",
};

export const AWS_REGION = {
  dev: "me-south-1",
  qa: "me-south-1",
  staging: "me-south-1",
  preprod: "me-south-1",
  prod: "me-south-1",
};

export const AWS_SECRET_NAME = {
  dev: `clearlink-dev`,
  qa: `clearlink-qa`,
  staging: `clearlink-staging`,
  preprod: `clearlink-preprod`,
  prod: `clearlink-prod`,
};

export const PLATFORM = {
  WEB: "Web",
  ANDROID: "Android",
  IOS: "IOS",
};

export const UPDATE_TYPE = {
  FORCE: "FORCE",
  OPTIONAL: "OPTIONAL",
};

export const SORT_ORDER = {
  ASC: 1,
  DESC: -1,
};

export enum USER_LOGIN_TYPE {
  EMAIL = "EMAIL",
  PHONE = "PHONE",
}

export enum LANGUAGE {
  ENGLISH = "en",
  ARABIC = "ar",
}
export enum NODE_ENV {
  LOCAL = "local",
  DEV = "dev",
  QA = "qa",
  STAGING = "staging",
  PREPROD = "preprod",
  PROD = "prod",
  PRODUCTION = "production",
}
export const bypassOtp = "123456";
export const bypassPassword = "String@123";

export const NOTIFICATION_EMAIL_CREATED_BY_ADMIN_PORTAL =
  "clearlink-admin-portal";

export const TIME_IN_SECS = {
  FIVE_MINUTES: 60 * 5,
  TEN_MINUTES: 60 * 10,
  FIFTEEN_MINUTES: 60 * 15,
};

export const DEFAULT_TIMEZONE = "Asia/Kolkata";
export const DEFAULT_LANGUAGE = LANGUAGE.ENGLISH;

export enum GENDER {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export enum SOCIAL_ACCOUNT_TYPE {
  GOOGLE = "GOOGLE",
  APPLE = "APPLE",
}

export enum STORAGE_PATH {
  PROFILE = "profile/",
  CSV = "csv/",
  XLSX = "xlsx/",
  LOGO = "logo/",
  BRANCH = "branch/",
  LIBRARY = "library/",
  RX_UPLOAD = "rx/",
}

export enum IMPORT_TYPE {
  CONCERN = "CONCERN",
}
export const IMPORT_HEADERS = {
  CONCERN: {
    NAME_EN: "Concern Name (En) *",
    NAME_AR: "Concern Name(Ar) *",
    DISPLAY_ORDER: "Display Order*",
    IMAGE: "Concern Image",
    ASSIGN_ITEMS: "Assign Items*",
  },
};
export enum REWARD_TRIGGER {
  SIGNUP = "SIGN-UP",
  FIRST_ORDER = "FIRST ORDER",
  FIRST_PAID_ORDER = "FIRST PAID ORDER",
}

export enum SPLIT_BONUS_ORDERS {
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}
export enum STREAMING_SERVICE_TYPE {
  SPORTS = "Sports",
  ENTERTAINMENT = "Entertainment",
}

