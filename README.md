# Gzhu Online Judge v3.9

* fixed the old data in regs collection
* delete some old and unuseful features in regform page
* add two features in user page (for admin)
  1. allow admin to change user's important information
  2. allow admin to clear user's important information
* change ranks collection's first field
  _id:'cid-name' ---> _id: { cid:cid, name:name }
* delete some unuseful '$and' when query
* initialize ranks when change the time of VIP contest, instead of deleting them