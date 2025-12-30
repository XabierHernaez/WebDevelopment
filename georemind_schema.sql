--
-- PostgreSQL database dump
--

\restrict a6oJrenAvURbOGGmdsZXKE0MXQGuOOchFFK3dgU16GUWAgHtjwqzmRwdiT7Yz6b

-- Dumped from database version 15.14 (Debian 15.14-1.pgdg13+1)
-- Dumped by pg_dump version 15.14 (Debian 15.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: friendships; Type: TABLE; Schema: public; Owner: georemind_user
--

CREATE TABLE public.friendships (
    id integer NOT NULL,
    requester_id integer NOT NULL,
    addressee_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT friendships_check CHECK ((requester_id <> addressee_id))
);


ALTER TABLE public.friendships OWNER TO georemind_user;

--
-- Name: friendships_id_seq; Type: SEQUENCE; Schema: public; Owner: georemind_user
--

CREATE SEQUENCE public.friendships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.friendships_id_seq OWNER TO georemind_user;

--
-- Name: friendships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: georemind_user
--

ALTER SEQUENCE public.friendships_id_seq OWNED BY public.friendships.id;


--
-- Name: group_members; Type: TABLE; Schema: public; Owner: georemind_user
--

CREATE TABLE public.group_members (
    id integer NOT NULL,
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.group_members OWNER TO georemind_user;

--
-- Name: group_members_id_seq; Type: SEQUENCE; Schema: public; Owner: georemind_user
--

CREATE SEQUENCE public.group_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.group_members_id_seq OWNER TO georemind_user;

--
-- Name: group_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: georemind_user
--

ALTER SEQUENCE public.group_members_id_seq OWNED BY public.group_members.id;


--
-- Name: group_reminders; Type: TABLE; Schema: public; Owner: georemind_user
--

CREATE TABLE public.group_reminders (
    id integer NOT NULL,
    reminder_id integer NOT NULL,
    group_id integer NOT NULL,
    shared_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.group_reminders OWNER TO georemind_user;

--
-- Name: group_reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: georemind_user
--

CREATE SEQUENCE public.group_reminders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.group_reminders_id_seq OWNER TO georemind_user;

--
-- Name: group_reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: georemind_user
--

ALTER SEQUENCE public.group_reminders_id_seq OWNED BY public.group_reminders.id;


--
-- Name: groups; Type: TABLE; Schema: public; Owner: georemind_user
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    owner_id integer NOT NULL,
    color character varying(7) DEFAULT '#6366f1'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.groups OWNER TO georemind_user;

--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: georemind_user
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.groups_id_seq OWNER TO georemind_user;

--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: georemind_user
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- Name: reminders; Type: TABLE; Schema: public; Owner: georemind_user
--

CREATE TABLE public.reminders (
    id integer NOT NULL,
    user_id integer,
    title character varying(255) NOT NULL,
    description text,
    reminder_type character varying(50) NOT NULL,
    datetime timestamp without time zone,
    location_id character varying(100),
    is_completed boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_notified boolean DEFAULT false,
    is_recurring boolean DEFAULT false,
    recurrence_pattern character varying(20),
    recurrence_end_date timestamp without time zone,
    CONSTRAINT reminders_recurrence_pattern_check CHECK (((recurrence_pattern)::text = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying, 'yearly'::character varying])::text[])))
);


ALTER TABLE public.reminders OWNER TO georemind_user;

--
-- Name: COLUMN reminders.is_recurring; Type: COMMENT; Schema: public; Owner: georemind_user
--

COMMENT ON COLUMN public.reminders.is_recurring IS 'Indica si el recordatorio se repite automáticamente';


--
-- Name: COLUMN reminders.recurrence_pattern; Type: COMMENT; Schema: public; Owner: georemind_user
--

COMMENT ON COLUMN public.reminders.recurrence_pattern IS 'Patrón de recurrencia: daily, weekly, monthly, yearly';


--
-- Name: COLUMN reminders.recurrence_end_date; Type: COMMENT; Schema: public; Owner: georemind_user
--

COMMENT ON COLUMN public.reminders.recurrence_end_date IS 'Fecha opcional de finalización de la recurrencia';


--
-- Name: reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: georemind_user
--

CREATE SEQUENCE public.reminders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reminders_id_seq OWNER TO georemind_user;

--
-- Name: reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: georemind_user
--

ALTER SEQUENCE public.reminders_id_seq OWNED BY public.reminders.id;


--
-- Name: shared_reminders; Type: TABLE; Schema: public; Owner: georemind_user
--

CREATE TABLE public.shared_reminders (
    id integer NOT NULL,
    reminder_id integer NOT NULL,
    owner_id integer NOT NULL,
    shared_with_id integer NOT NULL,
    can_edit boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shared_reminders OWNER TO georemind_user;

--
-- Name: shared_reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: georemind_user
--

CREATE SEQUENCE public.shared_reminders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.shared_reminders_id_seq OWNER TO georemind_user;

--
-- Name: shared_reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: georemind_user
--

ALTER SEQUENCE public.shared_reminders_id_seq OWNED BY public.shared_reminders.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: georemind_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    verification_code character varying(6),
    verification_code_expires timestamp without time zone
);


ALTER TABLE public.users OWNER TO georemind_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: georemind_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO georemind_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: georemind_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: friendships id; Type: DEFAULT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.friendships ALTER COLUMN id SET DEFAULT nextval('public.friendships_id_seq'::regclass);


--
-- Name: group_members id; Type: DEFAULT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.group_members ALTER COLUMN id SET DEFAULT nextval('public.group_members_id_seq'::regclass);


--
-- Name: group_reminders id; Type: DEFAULT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.group_reminders ALTER COLUMN id SET DEFAULT nextval('public.group_reminders_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- Name: reminders id; Type: DEFAULT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.reminders ALTER COLUMN id SET DEFAULT nextval('public.reminders_id_seq'::regclass);


--
-- Name: shared_reminders id; Type: DEFAULT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.shared_reminders ALTER COLUMN id SET DEFAULT nextval('public.shared_reminders_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY (id);


--
-- Name: friendships friendships_requester_id_addressee_id_key; Type: CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_requester_id_addressee_id_key UNIQUE (requester_id, addressee_id);


--
-- Name: group_members group_members_group_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_user_id_key UNIQUE (group_id, user_id);


--
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);


--
-- Name: group_reminders group_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.group_reminders
    ADD CONSTRAINT group_reminders_pkey PRIMARY KEY (id);


--
-- Name: group_reminders group_reminders_reminder_id_group_id_key; Type: CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.group_reminders
    ADD CONSTRAINT group_reminders_reminder_id_group_id_key UNIQUE (reminder_id, group_id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: reminders reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_pkey PRIMARY KEY (id);


--
-- Name: shared_reminders shared_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.shared_reminders
    ADD CONSTRAINT shared_reminders_pkey PRIMARY KEY (id);


--
-- Name: shared_reminders shared_reminders_reminder_id_shared_with_id_key; Type: CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.shared_reminders
    ADD CONSTRAINT shared_reminders_reminder_id_shared_with_id_key UNIQUE (reminder_id, shared_with_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_friendships_addressee; Type: INDEX; Schema: public; Owner: georemind_user
--

CREATE INDEX idx_friendships_addressee ON public.friendships USING btree (addressee_id);


--
-- Name: idx_friendships_requester; Type: INDEX; Schema: public; Owner: georemind_user
--

CREATE INDEX idx_friendships_requester ON public.friendships USING btree (requester_id);


--
-- Name: idx_friendships_status; Type: INDEX; Schema: public; Owner: georemind_user
--

CREATE INDEX idx_friendships_status ON public.friendships USING btree (status);


--
-- Name: idx_group_members_group; Type: INDEX; Schema: public; Owner: georemind_user
--

CREATE INDEX idx_group_members_group ON public.group_members USING btree (group_id);


--
-- Name: idx_group_members_user; Type: INDEX; Schema: public; Owner: georemind_user
--

CREATE INDEX idx_group_members_user ON public.group_members USING btree (user_id);


--
-- Name: idx_group_reminders_group; Type: INDEX; Schema: public; Owner: georemind_user
--

CREATE INDEX idx_group_reminders_group ON public.group_reminders USING btree (group_id);


--
-- Name: idx_group_reminders_reminder; Type: INDEX; Schema: public; Owner: georemind_user
--

CREATE INDEX idx_group_reminders_reminder ON public.group_reminders USING btree (reminder_id);


--
-- Name: idx_groups_owner; Type: INDEX; Schema: public; Owner: georemind_user
--

CREATE INDEX idx_groups_owner ON public.groups USING btree (owner_id);


--
-- Name: idx_reminders_recurring; Type: INDEX; Schema: public; Owner: georemind_user
--

CREATE INDEX idx_reminders_recurring ON public.reminders USING btree (is_recurring, recurrence_pattern) WHERE (is_recurring = true);


--
-- Name: idx_shared_reminders_owner; Type: INDEX; Schema: public; Owner: georemind_user
--

CREATE INDEX idx_shared_reminders_owner ON public.shared_reminders USING btree (owner_id);


--
-- Name: idx_shared_reminders_reminder; Type: INDEX; Schema: public; Owner: georemind_user
--

CREATE INDEX idx_shared_reminders_reminder ON public.shared_reminders USING btree (reminder_id);


--
-- Name: idx_shared_reminders_shared; Type: INDEX; Schema: public; Owner: georemind_user
--

CREATE INDEX idx_shared_reminders_shared ON public.shared_reminders USING btree (shared_with_id);


--
-- Name: friendships friendships_addressee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_addressee_id_fkey FOREIGN KEY (addressee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friendships friendships_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_members group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_reminders group_reminders_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.group_reminders
    ADD CONSTRAINT group_reminders_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_reminders group_reminders_reminder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.group_reminders
    ADD CONSTRAINT group_reminders_reminder_id_fkey FOREIGN KEY (reminder_id) REFERENCES public.reminders(id) ON DELETE CASCADE;


--
-- Name: group_reminders group_reminders_shared_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.group_reminders
    ADD CONSTRAINT group_reminders_shared_by_fkey FOREIGN KEY (shared_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: groups groups_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reminders reminders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shared_reminders shared_reminders_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.shared_reminders
    ADD CONSTRAINT shared_reminders_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shared_reminders shared_reminders_reminder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.shared_reminders
    ADD CONSTRAINT shared_reminders_reminder_id_fkey FOREIGN KEY (reminder_id) REFERENCES public.reminders(id) ON DELETE CASCADE;


--
-- Name: shared_reminders shared_reminders_shared_with_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: georemind_user
--

ALTER TABLE ONLY public.shared_reminders
    ADD CONSTRAINT shared_reminders_shared_with_id_fkey FOREIGN KEY (shared_with_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict a6oJrenAvURbOGGmdsZXKE0MXQGuOOchFFK3dgU16GUWAgHtjwqzmRwdiT7Yz6b

