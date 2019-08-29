# homefitTransfer

Hello There, So the folder is split up into two sections: the python barcode scanner script for the pi and the folder containing the webrtc application.

BARCODE SCANNER:

The barcode scanner is based off of this tutorial: https://www.pyimagesearch.com/2018/05/21/an-opencv-barcode-and-qr-code-scanner-with-zbar/

the script is all good to go, just need to reinstall libraries on your device.

WEBRTC APPLICATION:

the web rtc application is extremely complicated. Homefit wanted a multi channel, multi person webrtc video chat with the ability for one person to see everyone and the others to only see that person.
It is based off a webrtc tutorial found online and contains a readme on how to operate it.
It works by having the class leader join first so they can see everyone who joins. it works using parameters in the url string. an example url being: https://homefit.samjones3001.now.sh/public/?1?1?1

the 3 numbers at the end are the parameters: the first parameter is the name of the user, can be any string.
                                              the second parameter is the name of the room, assign different names for different rooms.
                                              the third parameter is if the user is an instructor or a user. 1 for instructor, anything else for others.
                                              
                                              hope this helps! please let me know if you have any questions.
                                              
                                              Currently there is a slight bug with the webrtc app. it times out after about 30s so you will need to implement a ping - pong system to keep the connection alive.
