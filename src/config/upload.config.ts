import multer from "fastify-multer";

export const multerOptions: any = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // e.g. 5MB
});

export const runMulter = (req: any, fieldName: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    multerOptions.single(fieldName)(req, {} as any, (err: any) => {
      if (err) return reject(err);
      resolve(req.file);
    });
  });
};
