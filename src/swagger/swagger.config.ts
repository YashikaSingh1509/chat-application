import { SERVICE_NAME } from "src/common/constants";
import { toTitleCase } from "src/utils";

const serviceName = toTitleCase(SERVICE_NAME);
export const SWAGGER_CONFIG = {
  PATH: `${serviceName.toLowerCase()}/api-docs`,
  TITLE: `Clearlink ${serviceName} APIs`,
  DESCRIPTION: `APIs Documentation for Clearlink ${serviceName} App.`,
  VERSION: "1.0",
  AUTH_TYPE: "basic",
  Add_API_KEY: {
    NAME: "authorization",
    IN: "header",
  },
  tags: [
    {
      name: `Clearlink_App_${serviceName}_APIs`,
      description: `APIs for ${serviceName}.`,
    },
  ],
};
