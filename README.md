# <b>Soil Backend API</b>

Welcome to the back-end repository for Soil.

## How to create the Backend:

First, install the dependencies from the root of the project:

```bash
npm i
``` 

Go into the server directory and start nodemon:
```bash
cd server
nodemon server.js
``` 

Once you see the message from mongoose/nodemon at the end: `Connected to db` then open up this link (port) in your browswer

http://localhost:5001/graphql
- we can query/mutate from the left panel
- we can review the output in the right panel

<br>

# Search for Skills

We use GraphQL for searching the databse from the front-end. A query may look something like this by read an ID input from the front-end `const {_id} = args.fields` to then create a query and eventual output like so:

```javascript
query{
  findSkills(fields:{
    # _id: "62ca8b55536e11000427f05f"
  }){
    _id
    name
    state
    members {
      discordName
    }
      
  }
}
```

Types:

- `findOne` = only one returned
    - Ex: `skillData = await Skills.findOne`
- `find` = return a list of items
    - Ex: `membersData = await Skills.find`



## Search for a Single Skill

Notice how we pass in the optional ID field. `$and` = special MongoDB comamnd for searching for multiple things at the same time.

```javascript
dif (_id) {

          membersData = await Skills.find( {
            $and: [
              { _id: fields._id },
              { state: "approved" },
            ]
        } )
```

## Search for Many Skills (i.e. All that are Approved)

Like wildcat, returns all skills w/ no restriction (i.e. field params):

```javascript
membersData = await Skills.find({state: "approved"})
```

<br>

## Status of Skills

When we create skill, we ask, is it approved?

Two statuses:

- `approved` = goes into DB for users to see/use
- `waiting` = goes to moderator (decide if skill should exist or be deleted)

