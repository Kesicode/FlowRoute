/**
 * services/providers/registry.ts
 *
 * Singleton provider registry. Providers register themselves on import;
 * the journey engine and UI retrieve them by id.
 */

import type { TransportProvider, AccommodationProvider, PlacesProvider } from "./base";

class ProviderRegistry {
  private transport = new Map<string, TransportProvider>();
  private accommodation = new Map<string, AccommodationProvider>();
  private places = new Map<string, PlacesProvider>();

  registerTransport(provider: TransportProvider): void {
    this.transport.set(provider.id, provider);
  }

  registerAccommodation(provider: AccommodationProvider): void {
    this.accommodation.set(provider.id, provider);
  }

  registerPlaces(provider: PlacesProvider): void {
    this.places.set(provider.id, provider);
  }

  getTransport(id: string): TransportProvider | undefined {
    return this.transport.get(id);
  }

  getAccommodation(id: string): AccommodationProvider | undefined {
    return this.accommodation.get(id);
  }

  listTransport(): TransportProvider[] {
    return [...this.transport.values()];
  }

  listAccommodation(): AccommodationProvider[] {
    return [...this.accommodation.values()];
  }

  /** Returns the first available transport provider, preferring non-demo. */
  defaultTransport(): TransportProvider | undefined {
    const providers = this.listTransport();
    return providers.find((p) => !p.isDemoProvider) ?? providers[0];
  }

  /** Returns the first available accommodation provider, preferring non-demo. */
  defaultAccommodation(): AccommodationProvider | undefined {
    const providers = this.listAccommodation();
    return providers.find((p) => !p.isDemoProvider) ?? providers[0];
  }
}

export const providerRegistry = new ProviderRegistry();
