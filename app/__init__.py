import os
from . import db
from flask import Flask, render_template, make_response, send_from_directory, redirect, url_for, request


def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object("config.DevelopmentConfig")

    print('instance_path %s' %  app.instance_path)

    db.init_app(app)

    @app.route('/')
    def index():
        return redirect(url_for('image'))

    @app.route('/images', defaults={'imgname': None})
    @app.route('/images/<imgname>')
    def image(imgname):
        conn = db.get_db()

        c = conn.cursor()
        c.execute("select * from images")
        rss = c.fetchall()

        imgnames = [rs[0] for rs in rss[:100]]
        imgstatuses= [rs[1] for rs in rss[:100]]
        guidelines_list= [rs[2] for rs in rss[:100]]

        if imgname is None:
            imgname = imgnames[3]
            guidelines = guidelines_list[3]
        else:
            poses = [i for i, n in enumerate(imgnames) if n == imgname]
            if len(poses) == 0:
                return 404
            else:
                imgname = imgnames[poses[0]]
                guidelines = guidelines_list[poses[0]]
        db.close_db()
        return render_template('index.html', title='Home', imgnames=imgnames, imgstatuses=imgstatuses, current_imgname=imgname, current_guidelines=guidelines)

    @app.route('/update', methods=['POST'])
    def update():
        for key in request.form:
            print(key, end=',')
        print('end form')
        conn = db.get_db()

        c = conn.cursor()
        rs = c.execute('Update images set guidelines = ?, imageStatus=? where imageName = ?', \
            (request.form['guidelines'], request.form['status'], request.form['imgname']))
        conn.commit()
        c.execute("select imageStatus from images where imageName = ?", (request.form['imgname'],))
        rs = c.fetchone()
        if rs is not None:
            newstatus = {'newstatus':rs[0]}
            html_code = 200
        else:
            newstatus = {'newstatus':'Error'}
            html_code = 501
        db.close_db()
        response = make_response(newstatus, html_code)
        response.headers = {"Content-Type": "application/json"}
        return response

    @app.route('/download/<path:filename>')
    def download_file(filename):
        return send_from_directory(app.config['IMAGE_DIR'], filename, as_attachment=True)

    return app