import { Injectable } from "@nestjs/common";

@Injectable()
export class JwtStrategy {
  //extends PassportStrategy(Strategy) {
  constructor() {
    // const jwtSecret = process.env.JWT_PASS;
    // super({
    //   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    //   ignoreExpiration: false,
    //   secretOrKey: jwtSecret,
    //   passReqToCallback: true,
    // });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
