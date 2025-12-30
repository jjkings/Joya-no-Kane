
export interface Temple {
  id: string;
  name: string;
  location: [number, number]; // [lat, lng]
  address: string;
  description?: string;
  history?: string;
  sources?: Array<{ title: string; uri: string }>;
}

export interface AppState {
  currentTemple: Temple | null;
  ringCount: number;
  totalGoal: number;
  isMapMode: boolean;
}
