import sqlite3
import os
import click
from flask import current_app, g
from flask.cli import with_appcontext


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DB_FILE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row

    return g.db


def close_db(e=None):
    db = g.pop('db', None)

    if db is not None:
        db.close()

def init_db():
    db = get_db()
    c = db.cursor()
    c.execute('''
    CREATE TABLE IF NOT EXISTS images (
    imageName TEXT PRIMARY KEY UNIQUE,
    imageStatus TEXT NOT NULL,
    guidelines TEXT
    );
    ''')
    #from time import time
    #tt = time()

    c.execute("select * from images")
    rowcount = len(c.fetchall())
    # print('found %d items in %f second' % (rowcount, time()-tt))
    # tt = time()
    if rowcount == 0:
        imgnames = list(os.listdir(current_app.config['IMAGE_DIR']))
        sql = "INSERT INTO images VALUES (?,?,?);"
        val = [(imgname, 'None','[]') for imgname in imgnames]
        c.executemany(sql, val)
        db.commit()
        #print('insert all in %f second' % (time() - tt))


@click.command('init-db')
@with_appcontext
def init_db_command():
    """Clear the existing data and create new tables."""
    init_db()
    click.echo('Initialized the database.')

def init_app(app):
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)