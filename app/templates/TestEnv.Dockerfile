FROM ubuntu
COPY ./ /root/workspace/resoursse
RUN
apt-get update
cd /root/workspace/resoursse/emsdk
./emsdk update
./emsdk install latest
./emsdk activate latest

cp emsdk_env.sh  ~/workspace/TestEnv/
python ./platforms/js/build_js.py --emscripten_dir /emsdk/emscripten/incoming build_js