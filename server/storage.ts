import { photoStrips, type PhotoStrip, type InsertPhotoStrip } from "@shared/schema";
import { sharedLinks, type SharedLink, type InsertSharedLink } from "@shared/schema";
import fs from "fs/promises";
import path from "path";

export interface IStorage {
  createPhotoStrip(photoStrip: InsertPhotoStrip): Promise<PhotoStrip>;
  createSharedLink(sharedLink: InsertSharedLink): Promise<SharedLink>;
  getSharedLink(id: string): Promise<SharedLink | null>;
  getPhotoStrip(id: number): Promise<PhotoStrip | null>;
  getPhotoStripsByUserId(userId: string): Promise<PhotoStrip[]>;
}

export class MemStorage implements IStorage {
  private photoStrips: Map<number, PhotoStrip>;
  private sharedLinks: Map<string, SharedLink>;
  currentId: number;
  visitorCount: number;
  visitorFilePath: string;

  constructor() {
    this.photoStrips = new Map();
    this.sharedLinks = new Map();
    this.currentId = 1;
    this.visitorCount = 300000;
    this.visitorFilePath = path.resolve(process.cwd(), "visitor-count.json");
    // initialize visitor count from file if present
    void this.loadVisitorCount();
  }

  async loadVisitorCount(): Promise<void> {
    try {
      const data = await fs.readFile(this.visitorFilePath, "utf-8");
      const parsed = JSON.parse(data);
      if (typeof parsed?.count === "number") {
        this.visitorCount = parsed.count;
      }
    } catch (e) {
      this.visitorCount = 300000;
      await this.persistVisitorCount();
    }
  }

  private async persistVisitorCount(): Promise<void> {
    try {
      await fs.writeFile(this.visitorFilePath, JSON.stringify({ count: this.visitorCount }), "utf-8");
    } catch (error) {
      console.error("Failed to persist visitor count:", error);
    }
  }

  async getVisitorCount(): Promise<number> {
    return this.visitorCount || 0;
  }

  async incrementVisitorCount(): Promise<number> {
    this.visitorCount = (this.visitorCount || 0) + 1;
    await this.persistVisitorCount();
    return this.visitorCount;
  }

  async createPhotoStrip(insertPhotoStrip: InsertPhotoStrip): Promise<PhotoStrip> {
    const id = this.currentId++;
    const photoStrip: PhotoStrip = { 
      ...insertPhotoStrip,
      id, 
      createdAt: new Date(),
      nameColor: insertPhotoStrip.nameColor || null,
      dateColor: insertPhotoStrip.dateColor || null,
      stripName: insertPhotoStrip.stripName || null,
    };
    this.photoStrips.set(id, photoStrip);
    return photoStrip;
  }

  async createSharedLink(insertSharedLink: InsertSharedLink): Promise<SharedLink> {
    const sharedLink: SharedLink = { 
      ...insertSharedLink,
      photoStripId: insertSharedLink.photoStripId || 0,
      createdAt: new Date(),
      isActive: true 
    };
    this.sharedLinks.set(sharedLink.id, sharedLink);
    return sharedLink;
  }

  async getSharedLink(id: string): Promise<SharedLink | null> {
    const link = this.sharedLinks.get(id);
    if (!link) return null;
    
    // Check if link is expired
    if (new Date() > new Date(link.expiresAt) || !link.isActive) {
      return null;
    }
    
    return link;
  }

  async getPhotoStrip(id: number): Promise<PhotoStrip | null> {
    return this.photoStrips.get(id) || null;
  }

  async getPhotoStripsByUserId(userId: string): Promise<PhotoStrip[]> {
    const userPhotoStrips: PhotoStrip[] = [];
    this.photoStrips.forEach((photoStrip) => {
      if (photoStrip.userId === userId) {
        userPhotoStrips.push(photoStrip);
      }
    });
    return userPhotoStrips.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

// Prototype extensions removed; class provides visitor count methods and persistence.

export const storage = new MemStorage();