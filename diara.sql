\c postgres

DROP DATABASE IF EXISTS diara;
CREATE DATABASE diara;

\c diara

create user diara with superuser login encrypted password 'mrjacarty';

--create
CREATE TABLE person
(
  id varchar,
  username varchar NOT NULL UNIQUE,
  email varchar NOT NULL UNIQUE,
  password varchar NOT NULL,
  first_name varchar NOT NULL,
  last_name varchar NOT NULL,
  info text,
  profpic_path varchar,
  logged_in boolean NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE project
(
  id varchar,
  user_id varchar NOT NULL, -- creator id
  name varchar NOT NULL,
  description text,
  create_date timestamp NOT NULL,
  deadline_date date,
  deadline_time time,
  edit_date timestamp,
  deleted boolean,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES person (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE collaborator
(
  project_id varchar NOT NULL,
  person_id varchar NOT NULL,
  status varchar,
  PRIMARY KEY (project_id, person_id),
  FOREIGN KEY (person_id) REFERENCES person (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE task
(
  id varchar,
  project_id varchar,
  task_id varchar,
  user_id varchar NOT NULL, -- creator id
  title varchar,
  create_date timestamp NOT NULL,
  deadline_date date,
  deadline_time time,
  edit_date timestamp,
  complete_date timestamp,
  description text,
  deleted boolean,
  PRIMARY KEY (id),
  FOREIGN KEY (project_id) REFERENCES project (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES task (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES person (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE rating
(
  task_id varchar,
  user_id varchar,
  rating integer,
  PRIMARY KEY (task_id, user_id),
  FOREIGN KEY (task_id) REFERENCES task (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES person (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE assignment
(
  assignee_id varchar NOT NULL,
  assigner_id varchar NOT NULL,
  task_id varchar NOT NULL,
  assign_date timestamp NOT NULL,
  PRIMARY KEY (assignee_id, task_id),
  FOREIGN KEY (task_id) REFERENCES task (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES person (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE attachment
(
  task_id varchar NOT NULL,
  filename varchar NOT NULL,
  create_date timestamp,
  deleted boolean,
  PRIMARY KEY (task_id, filename),
  FOREIGN KEY (task_id) REFERENCES task (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE comment
(
  id varchar,
  task_id varchar,
  user_id varchar, -- commenter id
  comment text NOT NULL,
  attachment varchar,
  comment_date timestamp,
  edit_date timestamp,
  deleted boolean,
  PRIMARY KEY (id),
  FOREIGN KEY (task_id) REFERENCES task (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES person (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE logs
(
  id varchar,
  user_id varchar NOT NULL,
  ip_address varchar,
  action varchar NOT NULL,
  log_date timestamp NOT NULL,
  carrier varchar,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES person (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE notif
(
  id varchar,
  user_id varchar,
  type varchar NOT NULL,
  type_id varchar NOT NULL,
  message varchar,
  operation varchar,
  create_date timestamp,
  read_date timestamp,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES person (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

grant all privileges on all tables in schema public to diara;
grant all privileges on all sequences in schema public to diara;
