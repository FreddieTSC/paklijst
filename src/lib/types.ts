// Hand-written DB types matching supabase/migrations/0001_init_schema.sql.
// Shape is what @supabase/supabase-js expects for full inference.

export type Category =
  | 'stuff' | 'eten' | 'electronica' | 'pharmacie' | 'spelletjes' | 'kleren' | 'todo';
export type ItemKind   = 'packable' | 'todo';
export type TagKind    = 'triptype' | 'weather' | 'activity' | 'custom';
export type TripStatus = 'planning' | 'active' | 'closed';
export type Verdict    = 'used' | 'unused' | 'missing';

export interface Household        { id: string; name: string; created_at: string; }
export interface HouseholdMember  { household_id: string; user_id: string; role: 'owner'|'member'; display_name: string; }
export interface Person           { id: string; household_id: string; name: string; is_child: boolean; user_id: string|null; }
export interface Item             { id: string; household_id: string; name: string; kind: ItemKind; wear_on_travel: boolean; default_category: Category; notes: string|null; qty: number; }
export interface Tag              { id: string; household_id: string; name: string; kind: TagKind; }
export interface ItemTag          { item_id: string; tag_id: string; }
export interface ItemForPerson    { item_id: string; person_id: string; }
export interface Trip             { id: string; household_id: string; name: string; start_date: string|null; end_date: string|null; status: TripStatus; context: TripContext; created_at: string; }
export interface TripContext      { persons: string[]; triptypes: string[]; weather: string[]; activities: string[]; }
export interface TripItem         { id: string; trip_id: string; item_id: string; person_id: string|null; checked: boolean; checked_by: string|null; checked_at: string|null; added_manually: boolean; qty: number; }
export interface TripFeedback     { id: string; trip_id: string; item_id: string; verdict: Verdict; context_snapshot: Partial<TripContext>; created_at: string; }

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

interface TableShape<R, I = Partial<R>, U = Partial<R>> {
  Row: R;
  Insert: I;
  Update: U;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      household:        TableShape<Household,        Partial<Household> & Pick<Household, 'name'>>;
      household_member: TableShape<HouseholdMember,  HouseholdMember>;
      person:           TableShape<Person,           Partial<Person> & Pick<Person, 'household_id'|'name'>>;
      item:             TableShape<Item,             Partial<Item> & Pick<Item, 'household_id'|'name'|'kind'|'default_category'>>;
      tag:              TableShape<Tag,              Partial<Tag> & Pick<Tag, 'household_id'|'name'|'kind'>>;
      item_tag:         TableShape<ItemTag,          ItemTag>;
      item_for_person:  TableShape<ItemForPerson,    ItemForPerson>;
      trip:             TableShape<Trip,             Partial<Trip> & Pick<Trip, 'household_id'|'name'>, Partial<Trip> & { context?: Json }>;
      trip_item:        TableShape<TripItem,         Partial<TripItem> & Pick<TripItem, 'trip_id'|'item_id'>>;
      trip_feedback:    TableShape<TripFeedback,     Partial<TripFeedback> & Pick<TripFeedback, 'trip_id'|'item_id'|'verdict'>>;
    };
    Views:           Record<string, never>;
    Functions: {
      seed_default_tags: { Args: { h_id: string }; Returns: void };
    };
    Enums:           Record<string, never>;
    CompositeTypes:  Record<string, never>;
  };
}
