#!/bin/bash
echo "Quit - Stream Deck"
osascript -e 'quit app "Stream Deck"'
Sleep 1

for i in $(ls -d Sources/*/)
do 
    PLUGIN=${i%/}
    PLUGIN=${PLUGIN##*/}
done
echo Plugin Name - $PLUGIN
echo
echo "Generate Release"

rm -r Release/
mkdir -p Release
./DistributionTool -b -i Sources/$PLUGIN -o Release
for i in $(ls Release); do 
    cp ./Release/"$i" temp.zip
done; 

rm -r ~/Library/Application\ Support/com.elgato.StreamDeck/Plugins/$PLUGIN
unzip temp.zip -d ~/Library/Application\ Support/com.elgato.StreamDeck/Plugins
rm temp.zip

echo "Start - Stream Deck"
open -a "Elgato Stream Deck"
sleep 3
open -a "Google Chrome" http://localhost:23654
echo "Done!"
exit 0
