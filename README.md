# To Do Manager CLI

![use-example](example.gif)

This library provides a CLI tool to manage locally "to do" tasks.

## Install

```
npm install -g todo-manager-cli
```

## Usage

```
todo -h
```

### First usage example


```
# create a new flow (an editor will be open)
todo new flow -n "default"

# show current flows
todo list flows

# create a new board
todo new board default -n "My new board"

# show current boards
todo list boards

# creates a new task and attaches it to the board
todo new task -n "My very first task" -b "My new board"

# show current tasks
todo

# change task's step (status)
todo move task "first task" -s "progress"

todo
```

## Description

It uses the [npm todo-manager package](https://www.npmjs.com/package/todo-manager) to store locally the information about the "to do"s.

This utility stores the information in YAML format, so it is easy to an human to read and modify source data files, if needed.

Also, it can be configured to globally or locally, get the source data files from one or another location. So, for example, you can use this tool to manage only the tasks about your project when you are inside the project's folder.

## Cheatsheet

- Quick look: `todo`
- Quick look filtered by task state: `todo task -s state`
- Quick look filtered by task name or id: `todo task -f keyword`
- Quick task creation and assign to board: `todo new task -n "My name" -b my-board`
- Quick task creation and assign to board with status:

  ```todo new task -n "My name" -b my-board -s status```

- Task detail view: `todo task my-task`
- Board deatail view: `todo board my-board`
- Move task to another board: `todo mv task -b new-board -s new-state`

## Usage

### Few concepts

This tool is based in three concepts: `task`, `board` and `flow`:

  - A `task` is a "to do".
  - A `board` is not only a container for tasks, but also links its tasks to the possible states they can have.
  - A `flow` is a collection of possible states for tasks.

So, each `board` has associated exactly one flow, and its tasks have associated exactly one of the states defined in that `flow`.

However, a `task` can be in exactly zero or one board. Tasks without associated board are called _orphans_ and have not an associated state.

### Commands

This tool can `show`, `create`, `edit` and `delete` any of the resources.
For more information about that type `todo <show | create | edit | delete> -h`.

## Configuration

First time you run the command, a configuration file will be created on `~/.config/todo-manager.yml`. This configuration can be manually edited.

### Overriding configuration

By adding the line

```
files: ["./tm.config.yml"]
```

on a configuration file, you can define a list of overriding configuration files.
If the file is found, the configuration will be override.

In this particular example, the tool will look for a local file `./tm.config.yml` with respect the location where command is launched.

In this way, if you run the command inside a project which has this file, the configuration will be overrided.

An interesting application of that is to allow some projects to use their own data files source.

## Other

#### About Flow Edition

When you edit a flow by the command `todo edit flow <flow expression>`, something similar to following opens in your text editor:

```yaml
name: Default
steps:
  - action: keep
    name: To Do
    color: red
  - action: keep
    name: In Progress
    color: yellow
  - action: keep
    name: Done
    color: green
description: |-
  This is the flow description.
  Observe it could have several lines.
default: To Do
```

Here, you can change the name or description as expected.
However, one can be interested into changing the steps by adding, removing or simple editing the names, the colors or even the order.

Since all those possibilities are not trivial to detect by just the arguments `name` and `color`, an extra member `action` appears to indicate exactly which change you want to perform to that step.
The valid options are:

- `keep`: Does not perform any change on that step.
- `add`: A new step, with the specified name and color, is added to the flow (in that position).
- `remove`: The step, identified by the specified name, is removed.
- `edit`: The name and color are changed, but the step remains the same. So all references to that step on tasks still as they are.
Note that, the member `name` is the reference to the current step, so it has to remain as is. To edit the name use the member `newName`.

Let us summarize with an example:


```yaml
name: Develompent Flow
steps:
  - action: add
    name: Idea
    color: cyan
  - action: remove
    name: To Do
  - action: keep
    name: In Progress
    color: yellow
  - action: edit
    name: Done
    newName: Ready
    color: yellow
description: |-
  This flow containst the steps of tasks a long a development process.
default: To Do
```

This will update the flow steps to:

- Add a new step called `Idea`.
- Remove the step called `To Do`.
- Do not change the step called `In Progress`.
- Rename the step called `Done` to `Ready`. Its color is changed also.


#### Allowed Flow Step Colors

Same as [commander](https://www.npmjs.com/package/commander):

  - black
  - red
  - green
  - yellow
  - blue
  - magenta
  - cyan
  - white
  - grey
  - redBright
  - greenBright
  - yellowBright
  - blueBright
  - magentaBright
  - cyanBright
  - whiteBright
