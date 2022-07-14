# <b>Soil Backend API</b>

Welcome to the back-end repository for Soil.

## How to Create the Backend:

First, install the dependencies from the root of the project:

```bash
npm i
``` 

To access the database, you need an .env file:

```bash
Ask @BluePanda for keys
```

Go into the server directory and start nodemon. If you do not have `nodemon`, install it with: `sudo npm i -g nodemon`. Once you have `nodemon` installed, run:

```bash
cd server
nodemon server.js
``` 

Once you see the message from mongoose/nodemon in the terminal saying: `Connected to db` then open up this link (port) in your browser:

http://localhost:5001/graphql
- left panel: for GraphQL queries/mutations
- right panel: review JSON response output

<br>

# 👩🏻‍💼 Members

# 🧑🏻‍🏭 Projects

Search for 1 or Many Project(s):

```graphql
query{
  findProjects(fields:{
        # _id: "62b7f58a2c02f8750d9624cd",
  }){
    _id
    title
    description
    team{
      memberInfo{
        discordName
      }
    }
      
  }
}
```


# 🏂 Skills

We use GraphQL for searching the databse from the front-end. A query may look something like this by read an ID input from the front-end `const {_id} = args.fields` to then create a query and eventual output like so:

## 🔍 Find 1 or Many Skill(s)
- Use the `_id` field:
```graphql
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


# 🥼 Skill Categories

# 🪅 Role Template



=======
# Tech To Make

- Create new user and put 0 for all attributes: `createMember`
- Read all attributes from query `findMember`

<!-- - Create new API: get user attributes and +1 to person -->