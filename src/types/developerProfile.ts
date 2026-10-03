export interface DeveloperLicense {
  type: string;
  number: string;
  state: string;
}

export interface PortfolioProject {
  address: string;
  year: string;
  type: string;
  disposition: string;
  role: string;
}

export interface DeveloperProfile {
  id?: string;
  user_id?: string;
  full_name: string;
  entity_name: string;
  professional_title: string;
  bio: string;
  phone: string;
  email: string;
  licenses: DeveloperLicense[];
  certifications: string[];
  years_experience: number | null;
  headshot_url: string;
  portfolio: PortfolioProject[];
}

export const EMPTY_DEVELOPER_PROFILE: DeveloperProfile = {
  full_name: "",
  entity_name: "",
  professional_title: "",
  bio: "",
  phone: "",
  email: "",
  licenses: [],
  certifications: [],
  years_experience: null,
  headshot_url: "",
  portfolio: [],
};
