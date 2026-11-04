import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { VerifyPermitUseCase } from "@application/use-cases/permits/verify-permit.use-case";

@ApiTags("public-permits")
@Controller("public/permits")
export class PublicPermitsController {
  constructor(private readonly verifyPermitUseCase: VerifyPermitUseCase) {}

  @Get("verify/:qrToken")
  @ApiOperation({
    summary: "Verify a permit QR token",
    description:
      "Returns permit status, location, passenger count, and leader details only.",
  })
  verify(@Param("qrToken") qrToken: string) {
    if (!/^[a-f0-9]{64}$/i.test(qrToken)) {
      throw new NotFoundException("Permit not found.");
    }

    return this.verifyPermitUseCase.execute(qrToken);
  }
}
