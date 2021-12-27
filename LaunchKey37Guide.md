# The LaunchKey Manual I was looking for...

This provides information about how to use the dang thing without it just 
being a slave to Ableton. Most of this has been figured out by hooking it 
up to a web-audio page and just see what comes out as I play with it.

## Keys:
Keys come through as 0x9A 48-84 (50 is )

## Pitch Bend and Mod Wheels
- Pitch Bend: 0xEA
- Mod Wheel: 0xBA

## Pad/Pot Modes:
Use the shift key to select the pad and pot modes. The pad modes are displayed
along the bottom row of pads while the pot modes are display in the top row.

### Pot Modes:
There are 4 different pot modes (x8 pots) gives access to up-to 32 parameters

#### MIDI Info:
status byte: 0xBA (channel 11)
controller-ids: 21-28,31-38,41-48,51-58

### Pad Modes:
- Session (only works if connected to Ableton)
- Drum: drums on the configured drum channel 0x99 36-51
    - black pads are active: 0xBF68-6A
- Scale Chord: 0x91
- User Chord: 0x91
- Minor Scale: 0x99: ??? 
- Alt Drums: 0x99, seems to be just a different layout
- CC Switches: 8 latching buttons (44-51) & 8 toggles (36-43) 0xB9 36-51
- Program 0-15: switch between 16 programs: 0xC9 0-15 (says channel 10 in menu)

### Other Controls: 0xBF
- track up/down (103/102)
- device select/lock (51/52)
- black pads around the pads
- capture midi, quantize, click, undo (74-77)
- play, stop, record, loop (115-118)
