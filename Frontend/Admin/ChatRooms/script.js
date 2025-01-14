import * as util from "../../utils.js";
import * as admin from "../utils.js";

(async () => {
    let user = await util.authenticate();
    admin.authorize(user);
    util.setHeader(user);

    function popConfirm(func, ...args) {
        let curtain = document.createElement("curtain");
        curtain.classList.add("curtain");
        curtain.innerHTML = `
            <curtain class="confirm">
                <p>Are you sure?</p>
                <button type="button" class="confirm-yes">Yes</button>
                <button type="button" class="confirm-no">No</button>
            </curtain>
        `;

        curtain.querySelector(".confirm-yes").addEventListener("click", (event) => {
            func(...args);
            curtain.parentNode.removeChild(curtain);
        });
        curtain.querySelector(".confirm-no").addEventListener("click", (event) => {
            curtain.parentNode.removeChild(curtain);
        });

        document.documentElement.appendChild(curtain);
    }

    function deleteChatRoom(chatRoomId) {
        fetch(util.urlBackend(`/admin/chat-rooms/${chatRoomId}`), {
            method: "DELETE",
        })
            .then(async (resp) => {
                if (resp.status >= 400) {
                    throw await resp.json();
                }
                return resp.json();
            })
            .then((msg) => {
                util.popAlert(msg.message, util.ALERT_TYPE.SUCCESS);
                fillChatRooms();
            })
            .catch((err) => {
                util.popAlert(err.error, util.ALERT_TYPE.DANGER);
            });
    }

    function deleteChatRoomBatch(chatRoomIds) {
        fetch(util.urlBackend(`/admin/chat-rooms`), {
            method: "DELETE",
            body: chatRoomIds,
        })
            .then(async (resp) => {
                if (resp.status >= 400) {
                    throw await resp.json();
                }
                return resp.json();
            })
            .then((msg) => {
                util.popAlert(msg.message, util.ALERT_TYPE.SUCCESS);
                fillChatRooms();
                document.getElementById("select-all-rooms").checked = false;
            })
            .catch((err) => {
                util.popAlert(err.error, util.ALERT_TYPE.DANGER);
            });
    }

    function updateSelected(checkbox) {
        let btnDelete = document.getElementById("delete-selected");

        if (checkbox.checked) {
            btnDelete.disabled = false;
        } else {
            for (let s of document.querySelectorAll(".select-chat-room")) {
                if (s.checked) {
                    btnDelete.disabled = false;
                    return;
                }
            }
            btnDelete.disabled = true;
        }
    }

    function getChatRoomBanner(chatRoom) {
        let div = document.createElement("div");
        div.innerHTML = `
            <a class="chat-room-banner hover-invert" id="${
                chatRoom.chatRoomId
            }">
                <p>${chatRoom.chatRoomName}</p>
                <p>${chatRoom.chatRoomAvailabilityDate ?? "Няма срок"}</p>
                <input type="checkbox" class="select-chat-room">
            </a>
        `;

        let banner = div.querySelector("a");
        let chatRoomAvailabilityDate = Date.parse(
            chatRoom.chatRoomAvailabilityDate
        );
        let now = new Date().getTime();
        if (chatRoomAvailabilityDate > now || !chatRoomAvailabilityDate) {
            banner.classList.add("active");
        }

        let checkbox = banner.querySelector(".select-chat-room");
        checkbox.addEventListener("change", (event) =>
            updateSelected(checkbox)
        );

        // deleteBtn.addEventListener("click", (event) => {
        //     let confirm = deleteBtn.querySelector(".confirm");
        //     if (event.target !== event.currentTarget) {
        //         return;
        //     }

        //     if (confirm) {
        //         deleteBtn.removeChild(confirm);
        //     } else {
        //         popConfirm(
        //             event.currentTarget,
        //             deleteChatRoom,
        //             chatRoom.chatRoomId
        //         );
        //     }
        // });

        banner.addEventListener("click", (event) => {
            if (event.target.tagName !== "INPUT") {
                window.location = util.urlFrontend(
                    `/ChatRoom?chatRoomId=${chatRoom.chatRoomId}`
                );
            }
        });

        return banner;
    }

    async function getAllChatRooms() {
        return fetch(util.urlBackend("/admin/chat-rooms"))
            .then(async (resp) => {
                if (resp.status != 200) {
                    throw await resp.json();
                }
                return resp.json();
            })
            .then((rooms) => rooms)
            .catch((err) => console.log(err.error));
    }

    function getUserRow(user) {
        let row = document.createElement("li");
        row.id = user.userId;
        row.innerHTML = `
            <div>${user.userName}</div>
            <div>${user.userIdentity}</div>
            <div>
                <label for="input">Анонимен</label>
                <input type="checkbox" class="is-anonymous">
            </div>
        `;

        let isAnonymous = row.querySelector("input");
        isAnonymous.addEventListener("change", (event) => {
            if (isAnonymous.checked) {
                row.classList.add("anonymous");
            } else {
                row.classList.remove("anonymous");
            }
        });
        isAnonymous.checked = true;
        row.classList.add("anonymous");

        return row;
    }

    function closeSelectUsers() {
        let select = document.querySelector(".select-users");
        if (select) {
            select.style.maxHeight = "0";
            select.addEventListener("transitionend", () => {
                if (select.parentNode) {
                    select.parentNode.removeChild(select);
                    document
                        .querySelector("#add-users-btn")
                        .classList.remove("dropped");
                }
            });
        }
    }

    async function fillChatRooms() {
        let list = document.getElementById("chatRooms");
        while (list.lastChild) {
            list.removeChild(list.lastChild);
        }

        (await getAllChatRooms()).forEach((r) => {
            list.appendChild(getChatRoomBanner(r));
        });
    }

    function clearUsersList() {
        let usersList = document.querySelector(".users-data-list");
        while (usersList.lastChild) {
            usersList.removeChild(usersList.lastChild);
        }
    }

    document
        .getElementById("create-room-btn")
        .addEventListener("click", (event) => {
            let roomName = document.getElementById("room-name");

            if (
                roomName.validity.valueMissing &&
                document.getElementById("from-csv").files.length === 0
            ) {
                roomName.setCustomValidity("Името е задължителнo.");
            } else {
                roomName.setCustomValidity("");
            }
            roomName.reportValidity();
        });

    document
        .getElementById("room-create-form")
        .addEventListener("submit", (event) => {
            event.preventDefault();

            let csv = document.getElementById("from-csv").files[0] ?? null;

            if (!csv) {
                let options = {
                    method: "POST",
                    body: JSON.stringify({
                        chatRoomName:
                            document.getElementById("room-name").value,
                        chatRoomAvailabilityDate:
                            document.getElementById("room-expiry-date")
                                .value === ""
                                ? null
                                : document.getElementById("room-expiry-date")
                                      .value,
                        userChats: [
                            ...document.querySelectorAll(".users-data-list li"),
                        ].map((li) => {
                            return {
                                userId: li.id,
                                userChatIsAnonymous:
                                    li.querySelector(".is-anonymous").checked,
                            };
                        }),
                    }),
                };

                fetch(util.urlBackend("/admin/chat-rooms"), options)
                    .then(async (resp) => {
                        if (resp.status >= 200 && resp.status < 400) {
                            util.popAlert(
                                (await resp.json()).message,
                                util.ALERT_TYPE.SUCCESS
                            );
                            clearUsersList();
                            fillChatRooms();
                        } else {
                            throw await resp.json();
                        }
                    })
                    .catch((err) =>
                        util.popAlert(err.error, util.ALERT_TYPE.DANGER)
                    );
            } else {
                let data = new FormData();
                data.append("file", csv);

                let options = {
                    method: "POST",
                    body: data,
                };

                fetch(util.urlBackend("/admin/chat-rooms/from-csv"), options)
                    .then(async (resp) => {
                        if (resp.status >= 200 && resp.status < 400) {
                            util.popAlert(
                                (await resp.json()).message,
                                util.ALERT_TYPE.SUCCESS
                            );

                            let csvInput = document.getElementById("from-csv");
                            csvInput.value = null;
                            csvInput.dispatchEvent(new Event("change"));

                            clearUsersList();
                            fillChatRooms();
                        } else {
                            throw await resp.json();
                        }
                    })
                    .catch((err) =>
                        util.popAlert(err.error, util.ALERT_TYPE.DANGER)
                    );
            }
        });

    document
        .getElementById("add-users-btn")
        .addEventListener("click", async (event) => {
            let btn = event.currentTarget;

            if (!btn.classList.contains("dropped")) {
                let select = document.createElement("div");
                select.classList.add("select-users");

                btn.parentNode.appendChild(select);
                btn.classList.add("dropped");

                let users = await admin.getAllUsers();
                let section = admin.createUsersSection(users);

                select.appendChild(section);

                for (let user of users) {
                    let checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.classList.add("select-user-checkbox");

                    let usersDataList =
                        document.querySelector(".users-data-list");
                    if (document.getElementById(user.userId) != null) {
                        checkbox.checked = true;
                    }

                    checkbox.addEventListener("change", (event) => {
                        if (checkbox.checked) {
                            usersDataList.appendChild(getUserRow(user));
                        } else {
                            usersDataList.removeChild(
                                document.getElementById(`${user.userId}`)
                            );
                        }
                    });

                    user.banner.appendChild(checkbox);
                }
            } else {
                closeSelectUsers();
            }
        });

    document.addEventListener("click", (event) => {
        if (
            !event.target.matches(".select-users, .select-users *, .curtain") &&
            !event.target.matches("#add-users-btn")
        ) {
            closeSelectUsers();
        }
    });

    document.getElementById("from-csv").addEventListener("change", (event) => {
        let file = event.currentTarget.files[0];
        let list = document.querySelector(".users-data-list");

        clearUsersList();

        if (file) {
            let fileRow = document.createElement("li");
            fileRow.innerHTML = file.name;
            list.appendChild(fileRow);
        }

        for (let formElement of document.querySelectorAll(
            ".room-data input:not([id*='from-csv']), .room-data button:not([id*='create-room-btn'])"
        )) {
            if (file) {
                formElement.disabled = true;
            } else {
                formElement.disabled = false;
            }
        }
    });

    fillChatRooms();
    let selectAll = document.getElementById("select-all-rooms");
    selectAll.addEventListener("change", (event) => {
        document
            .querySelectorAll(".select-chat-room")
            .forEach((s) => (s.checked = selectAll.checked));
        updateSelected(selectAll);
    });

    let deleteBtn = document.getElementById("delete-selected");
    deleteBtn.addEventListener("click", (event) => {
        let chatRoomIds = [
            ...document.querySelectorAll(
                ".chat-room-banner .select-chat-room:checked"
            ),
        ].map((e) => e.parentNode.id);

        popConfirm(() => {
            if (chatRoomIds.length > 1) {
                deleteChatRoomBatch(chatRoomIds);
            } else {
                deleteChatRoom(chatRoomIds[0]);
            }
        }, chatRoomIds);
    });
})();
