import {
  type AnnouncementType,
  type SupportCategory,
  type SupportPriority,
  type SupportStatus,
  type UserRole,
} from "./enums.types";

/**
 * Named `SupportTicket` on the backend, not `Ticket` — that name belongs to a
 * flight ticket in this product, and the collision is why the model was
 * renamed during the port.
 */
export interface ISupportMessage {
  id: string;
  supportTicketId: string;
  senderId: string;
  sender?: { id: string; name: string } | null;
  /** Which side wrote it, so the thread can be read without knowing the ids. */
  senderRole: UserRole;
  message: string;
  createdAt: string;
}

export interface ISupportTicket {
  id: string;
  agencyId: string;
  agency?: { id: string; name: string } | null;
  createdById: string;
  createdBy?: { id: string; name: string; email: string } | null;
  subject: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ISupportTicketDetail extends ISupportTicket {
  messages: ISupportMessage[];
}

export interface IAnnouncement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  /** Present only on the tenant-facing list — per-user, not global. */
  isRead?: boolean;
}

export interface ICreateSupportTicketPayload {
  subject: string;
  message: string;
  category?: SupportCategory;
  priority?: SupportPriority;
}

export interface IAddMessagePayload {
  message: string;
}

export interface IUpdateTicketStatusPayload {
  status: SupportStatus;
}

export interface ICreateAnnouncementPayload {
  title: string;
  message: string;
  type?: AnnouncementType;
}

export interface IUpdateAnnouncementPayload extends Partial<ICreateAnnouncementPayload> {
  isActive?: boolean;
}
