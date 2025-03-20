// Klaviyo integration using their REST API directly
const KLAVIYO_API_ENDPOINT = 'https://a.klaviyo.com/api';

export interface KlaviyoProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  externalId?: string;
  properties?: Record<string, any>;
}

export class KlaviyoService {
  private static async makeRequest(endpoint: string, method: string, data?: any) {
    try {
      const response = await fetch(`${KLAVIYO_API_ENDPOINT}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Klaviyo-API-Key ${import.meta.env.VITE_KLAVIYO_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'revision': '2023-12-15'
        },
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        throw new Error(`Klaviyo API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Klaviyo API request failed:', error);
      throw error;
    }
  }

  static async subscribeToList(listId: string, profile: KlaviyoProfile) {
    try {
      await this.makeRequest(`/lists/${listId}/relationships/profiles/`, 'POST', {
        data: [{
          type: 'profile',
          attributes: {
            email: profile.email,
            first_name: profile.firstName,
            last_name: profile.lastName,
            phone_number: profile.phone,
            external_id: profile.externalId,
            properties: profile.properties
          }
        }]
      });
      return true;
    } catch (error) {
      console.error('Error subscribing to Klaviyo list:', error);
      return false;
    }
  }

  static async unsubscribeFromList(listId: string, email: string) {
    try {
      // First get the profile ID
      const profileResponse = await this.makeRequest(`/profiles/`, 'GET', {
        filter: `equals(email,"${email}")`
      });
      
      const profileId = profileResponse.data?.[0]?.id;
      if (!profileId) throw new Error('Profile not found');

      await this.makeRequest(`/lists/${listId}/relationships/profiles/`, 'DELETE', {
        data: [{
          type: 'profile',
          id: profileId
        }]
      });
      return true;
    } catch (error) {
      console.error('Error unsubscribing from Klaviyo list:', error);
      return false;
    }
  }

  static async trackEvent(eventName: string, email: string, properties: Record<string, any> = {}) {
    try {
      await this.makeRequest('/events/', 'POST', {
        data: {
          type: 'event',
          attributes: {
            metric: {
              name: eventName
            },
            profile: {
              email
            },
            properties
          }
        }
      });
      return true;
    } catch (error) {
      console.error('Error tracking Klaviyo event:', error);
      return false;
    }
  }

  // Helper methods for common operations
  static async subscribeToNewsletter(profile: KlaviyoProfile) {
    return this.subscribeToList(import.meta.env.VITE_KLAVIYO_NEWSLETTER_LIST_ID, profile);
  }

  static async subscribeCustomer(profile: KlaviyoProfile) {
    return this.subscribeToList(import.meta.env.VITE_KLAVIYO_CUSTOMERS_LIST_ID, profile);
  }

  static async addToAbandonedCart(profile: KlaviyoProfile) {
    return this.subscribeToList(import.meta.env.VITE_KLAVIYO_ABANDONED_CART_LIST_ID, profile);
  }

  static async addToProUsers(profile: KlaviyoProfile) {
    return this.subscribeToList(import.meta.env.VITE_KLAVIYO_PRO_USERS_LIST_ID, profile);
  }
}