import { Asset } from "@stellar/stellar-sdk";

/**
 * Configuration interface for Stellar assets
 */
export interface StellarAssetConfig {
  readonly code: string;
  readonly decimals: number;
  readonly issuer?: string;
  readonly asset: Asset;
}

/**
 * Stellar network configuration
 */
export interface StellarNetworkConfig {
  readonly rpcUrl: string;
  readonly networkPassphrase: string;
}

/**
 * Stellar configuration class containing all network and asset configurations
 */
export class StellarConfig {
  /**
   * Default Stellar network configuration
   */
  static readonly NETWORK: StellarNetworkConfig = {
    rpcUrl: "https://horizon.stellar.org",
    networkPassphrase: "Public Global Stellar Network ; September 2015"
  } as const;

  /**
   * Native XLM asset configuration
   */
  static readonly NATIVE_ASSET: StellarAssetConfig = {
    code: "XLM",
    decimals: 7,
    asset: Asset.native()
  } as const;

  /**
   * USDC asset configuration
   */
  static readonly USDC_ASSET: StellarAssetConfig = {
    code: "USDC",
    decimals: 7,
    issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    get asset() {
      return new Asset(this.code, this.issuer!);
    }
  } as const;

  /**
   * Get asset configuration by code
   */
  static getAssetByCode(code: string): StellarAssetConfig | undefined {
    switch (code.toUpperCase()) {
      case "XLM":
        return this.NATIVE_ASSET;
      case "USDC":
        return this.USDC_ASSET;
      default:
        return undefined;
    }
  }

  /**
   * Get all available assets
   */
  static getAllAssets(): readonly StellarAssetConfig[] {
    return [this.NATIVE_ASSET, this.USDC_ASSET] as const;
  }
}
