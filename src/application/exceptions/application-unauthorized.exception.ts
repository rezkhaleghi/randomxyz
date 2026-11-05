export class ApplicationUnauthorizedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApplicationUnauthorizedException";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
