import { Controller, Get, Param, Query } from '@nestjs/common';
import { CountryService } from './country.service.js';

@Controller()
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get('platform/config')
  async getPlatformConfig() {
    return this.countryService.getPlatformConfig();
  }

  @Get('countries')
  async getCountries(@Query('all') all?: string) {
    return this.countryService.getCountries(all === 'true');
  }

  @Get('countries/:code')
  async getCountry(@Param('code') code: string) {
    return this.countryService.getCountryByCode(code);
  }

  @Get('countries/:code/requirements')
  async getCountryRequirements(
    @Param('code') code: string,
    @Query('userType') userType?: string,
  ) {
    return this.countryService.getCountryRequirements(code, userType);
  }
}

