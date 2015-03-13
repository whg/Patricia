# Patricia (a.k.a. Trisha)

A JavaScript tool to draw triangles. Connects to Roland the plotter.

## Usage

Fire up the server: `python server.py`

Patricia tries to be a bit like Adobe's Illustrator; Pressing keys enables different modes or tools. These are also shown in the left hand toolbar. The main view shows a sheet of A3. You can pan by scrolling and in normal operation, to zoom, hold the option/alt key to zoom while scrolling.

### Modes/Tools

- Draw (**a**): Drag the mouse to create a shape.
- DrawFollow (**f**): Like above, but this is both constructive and desctrucive, if you move to an empty triangle it will fill it, but if you move to a filled one it will remove it.
- Erase (**e**): Erase the contents of a triangle, by clicking or dragging.
- Select (**s**): Select shapes by clicking or dragging a marquee.
- Move (**m**): Move the selected shapes or the shape that you initally click on.
- Clone Appearence (**c**): Clone the appearence of a shape by clicking on it. If you command click you select the shape you want to clone from. My default you clone the current/selected shape (more on that later).
- View (**v**): Scrolling now zooms in and out and you can pan by dragging.

### Actions

Actions are shown on the top tool bar, they can also be invoked by combining keys with one or more modifier. The Control key is mirrored with Command.

- Merge (**Command-m**): Merge selected shapes.
- Duplicate (**Command-d**): Duplicate the selected shapes at location. (The new shapes are selected after this action.)
- Undo (**Command-z**)
- Redo (**Command-Shift-z**)
- Plot (**Command-p**): Plot all the shapes.
- Plot selected (**Command-Shift-p**): Plot the selected shapes.
- Download (**Command-s**)
- Upload (**Command-o**)

You can delete the selected shapes by hitting the backspace key.

### Shapes

All shapes are shown in the right hand tool bar. You can change their order by dragging them over each other. This is useful if you have two shapes on top of each other.

By clicking on the the arrow next to the name you can edit their properties. Not all of the options here will be visible from the browser, such as pen number. In order for the offset fill to work, the server (shown in the top right) needs to be connected.

The current shape has a green stripe/border on the left.

### Saving, Loading & Offsets

For these to work, you need to make sure the server is running!

## Dependencies

- **Python** (flask, chiplotle, [pyserial])
- **CGAL** (Boost, CMake, etc)


