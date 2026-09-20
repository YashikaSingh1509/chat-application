import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";

export const addMethods = (serviceName: string, grpcMethods: string[]) => {
  return function (constructor: Function) {
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );

      GrpcMethod(serviceName, method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }

    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcStreamMethod(serviceName, method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
};
