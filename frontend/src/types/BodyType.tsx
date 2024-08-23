import { AccountInfo } from "./AccountInfo";

export interface BodyType {
  currentUserData: AccountInfo | null;
  photoUrl?: string | null;
  handleLogout?: () => void;
}
