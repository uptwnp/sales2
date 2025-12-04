export type LeadStage =
  | 'Init - Fresh'
  | 'Init - Not Connected Yet'
  | 'Init - General Enquiry'
  | 'Mid - Exploring'
  | 'Mat - Follow Up'
  | 'Mat - In Pipeline'
  | 'Mat - In Closure'
  | 'Mat - Re Exploring'
  | 'Deal - Closed'
  | 'Neg - Low Bids'
  | 'Neg - Budget Issue'
  | 'Neg - Unrealistic'
  | 'Neg - Req Closed'
  | 'Neg - Invalid'
  | 'Neg - Lost'
  | 'Neg - Useless'
  | 'Other';

export type TodoType =
  | 'Follow Up'
  | 'Meeting'
  | 'Find Match'
  | 'Schedule Site Visit'
  | 'Todo'
  | 'Activity'
  | 'Other';

export type TodoStatus = 'Pending' | 'Completed' | 'Cancelled' | 'Overdue';


export type Priority = 'Super High' | 'High' | 'Focus' | 'General' | 'Low' | 'Avoid' | 'Never Attend';

export type Source =
  | 'Organic Social Media'
  | 'Youtube'
  | 'Referral'
  | 'GMB Others'
  | 'Website Others'
  | 'Our GMB'
  | 'Website'
  | 'M3M'
  | 'Trident'
  | 'Dealer Network'
  | 'Social Media'
  | 'Cold Call'
  | 'Olx'
  | 'Offline Meet'
  | 'Property DB'
  | 'Shoping'
  | 'Other'
  | 'Groups'
  | 'Ads Display'
  | 'Ads Search'
  | 'Many Chats'
  | 'Listings'
  | 'Physical World'
  | 'Holdings'
  | 'Other Organic Display'
  | 'Other Organic Search';



export type NextAction =
  | 'Call Back'
  | 'Site Visit'
  | 'Follow Up'
  | 'Meeting'
  | 'Other';

export type Segment =
  | 'Panipat'
  | 'Panipat Projects'
  | 'Panipat Investors'
  | 'Rohtak'
  | 'Sonipat'
  | 'Sigma'
  | 'Trident'
  | 'Godrej'
  | 'M3M';

export type Purpose = 'Self Use' | 'Investment' | 'Rental' | 'Resale' | 'Other';

export interface Lead {
  id: number;
  name: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  stage: LeadStage;
  ourRating?: string;
  budget: number;
  preferredLocation: string[];
  preferredSize: string[];
  note?: string;
  requirementDescription?: string;
  propertyType: string[];
  purpose: Purpose;
  about?: string;
  segment: Segment;
  source: Source;
  priority: Priority;
  nextAction?: NextAction;
  nextActionNote?: string;
  intent?: string;
  listName?: string;
  tags: string[];
  assignedTo: string[];
  data1?: string;
  data2?: string;
  data3?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface Todo {
  id: number;
  leadId: number;
  type: TodoType;
  description?: string;
  responseNote?: string;
  status: TodoStatus;
  dateTime: string;
  participants: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TagOption {
  value: string;
  label: string;
}

export interface DropdownOption {
  value: string;
  label: string;
  searchable?: boolean;
}

export interface FilterOption {
  field: string;
  operator: string;
  value: string | number | string[];
}
