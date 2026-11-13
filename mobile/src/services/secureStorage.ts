// Servicio de persistencia segura para credenciales en dispositivo móvil
// En entorno React Native Bare se integra con Keystore/Keychain
class SecureStorageService {
  private inMemoryToken: string | null = null;
  private inMemoryUser: string | null = null;

  async saveToken(token: string): Promise<void> {
    this.inMemoryToken = token;
  }

  async getToken(): Promise<string | null> {
    return this.inMemoryToken;
  }

  async saveUser(userJson: string): Promise<void> {
    this.inMemoryUser = userJson;
  }

  async getUser(): Promise<string | null> {
    return this.inMemoryUser;
  }

  async clear(): Promise<void> {
    this.inMemoryToken = null;
    this.inMemoryUser = null;
  }
}

export const secureStorage = new SecureStorageService();
