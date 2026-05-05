-- Enable Supabase Realtime for the trip_item table so that check-offs
-- from one device are instantly visible on another.
alter publication supabase_realtime add table inpaklijst_trip_item;
