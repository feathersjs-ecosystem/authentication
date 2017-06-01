'use strict';

module.exports = function updateEntity (entity, meta) {
  const { app } = meta;
  const authConfig = app.get('auth');
  var idField = app.service(authConfig.service).id;
  const entityId = entity[idField];
  var socketMap;

  if (!idField) {
    console.error(`The adapter for the ${authConfig.service} service does not add an \`id\` property to the service.  It needs to be updated to do so.`);
    idField = 'id' || '_id';
  }

  if (app.io) {
    socketMap = app.io.sockets.sockets;
  }
  if (app.primus) {
    socketMap = app.primus.connections;
  }

  Object.keys(socketMap).forEach(socketId => {
    const socket = socketMap[socketId];
    const socketEntity = (socket.feathers && socket.feathers[authConfig.entity]) || socket.request.feathers[authConfig.entity];

    if (socketEntity) {
      const socketEntityId = socketEntity[idField];

      if (entityId === socketEntityId) {
        Object.assign(socketEntity, entity);
      }
    }
  });
};
