import { TmarIdentity } from "./tmar-identity.interface";

export abstract class TmarTokenVerifier {
  abstract verify(token: string): TmarIdentity;
}
