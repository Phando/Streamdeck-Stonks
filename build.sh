#!/bin/bash
echo "Quit - Stream Deck"
osascript -e 'quit app "Stream Deck"'
Sleep 1

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd $SCRIPT_DIR

for i in $(ls -d Sources/*/)
do 
    PLUGIN=${i%/}
    PLUGIN=${PLUGIN##*/}
done
echo Plugin Name - $PLUGIN
echo "Generate Release"
if [ -d "Release" ]
then
    rm -rf Release/
fi
mkdir -p Release
rm -r ~/Library/Application\ Support/com.elgato.StreamDeck/Plugins/$PLUGIN
cp -R Sources/ ~/Library/Application\ Support/com.elgato.StreamDeck/Plugins
./DistributionTool -b -i Sources/$PLUGIN -o Release
echo "Start - Stream Deck"
open -a "Stream Deck"
sleep 3
open -a "Google Chrome" http://localhost:23654
echo "Exit"
exit 0

