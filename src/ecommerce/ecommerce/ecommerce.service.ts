import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { EcommerceGateway } from 'src/lib/interfaces/ecommerce-gateway.enum';

@Injectable()
export class EcommerceService {
  constructor(private readonly httpService: HttpService) {}

  async findOneProduct(
    productId: string,
    gateway: EcommerceGateway = EcommerceGateway.STRIPE,
  ) {
    try {
      const url =
        process.env.ECOMMERCE_SERVICE_PUBLIC_LISTENER_ROOT_URL +
        `/product/${productId}`;
      const params = new URLSearchParams({
        gateway,
      });
      const queryString = params.toString();
      return await this.httpService.axiosRef
        .get(url + '?' + queryString)
        .then((data) => data);
    } catch (error) {
      throw new BadRequestException(
        `${
          error?.response?.data?.message ||
          'error making request to ecommerce webservice'
        }`,
      );
    }
  }

  async createCustomer(
    email: string,
    fullName: string,
    gateway: EcommerceGateway = EcommerceGateway.STRIPE,
  ): Promise<{ id: string }> {
    const url =
      process.env.ECOMMERCE_SERVICE_PRIVATE_LISTENER_ROOT_URL +
      `/gateway/customer`;
    console.log(url);
    try {
      return await this.httpService.axiosRef
        .post<any, AxiosResponse<{ id: string }>>(url, {
          email,
          fullName,
          gateway,
        })
        .then(({ data }) => data);
    } catch (error) {
      throw new BadRequestException(
        `${
          error?.response?.data?.message ||
          'error making request to ecommerce webservice'
        }`,
      );
    }
  }

  async applySubscriptionDiscount(
    ecommerceCustomer: string,
    contract: string,
    discountPercent: number,
    gateway: EcommerceGateway = EcommerceGateway.STRIPE,
  ): Promise<{ id: string }> {
    const url =
      process.env.ECOMMERCE_SERVICE_PRIVATE_LISTENER_ROOT_URL +
      `/gateway/subscription/active/discount`;
    console.log(url);
    try {
      return await this.httpService.axiosRef
        .post<any, AxiosResponse<{ id: string }>>(url, {
          customer: ecommerceCustomer,
          discountPercent,
          contract,
          gateway,
        })
        .then(({ data }) => data);
    } catch (error) {
      throw new BadRequestException(
        `${
          error?.response?.data?.message ||
          'error making request to ecommerce webservice'
        }`,
      );
    }
  }

  async cancelSubscription(
    ecommerceCustomer: string,
    contract: string,
    gateway: EcommerceGateway = EcommerceGateway.STRIPE,
  ): Promise<{ id: string }> {
    const url =
      process.env.ECOMMERCE_SERVICE_PRIVATE_LISTENER_ROOT_URL +
      `/gateway/subscription/cancel`;
    console.log(url);
    try {
      return await this.httpService.axiosRef
        .post<any, AxiosResponse<{ id: string }>>(url, {
          customer: ecommerceCustomer,
          contract,
          gateway,
        })
        .then(({ data }) => data);
    } catch (error) {
      throw new BadRequestException(
        `${
          error?.response?.data?.message ||
          'error making request to ecommerce webservice'
        }`,
      );
    }
  }

  async createPaymentCheckoutUrl(
    customerEmail: string,
    product: string,
    quantity: number,
    metadata: Record<string, string> = {},
    gateway: EcommerceGateway = EcommerceGateway.STRIPE,
  ): Promise<{ url: string }> {
    const url =
      process.env.ECOMMERCE_SERVICE_PRIVATE_LISTENER_ROOT_URL +
      `/gateway/checkout`;
    console.log(url);
    try {
      return await this.httpService.axiosRef
        .post<any, AxiosResponse<{ url: string }>>(url, {
          customerEmail,
          product,
          quantity,
          metadata,
          gateway,
        })
        .then(({ data }) => data);
    } catch (error) {
      throw new BadRequestException(
        `${
          error?.response?.data?.message ||
          'error making request to ecommerce webservice'
        }`,
      );
    }
  }
}
