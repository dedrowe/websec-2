const baseUrl = 'http://localhost:3000/api'

async function getFaculties() {
    const faculties = await axios.get(baseUrl + '/rasp/faculties');

    faculties.data.forEach(element => {
        let url = new URL('http://localhost:3000/groups.html');
        url.searchParams.set('facultyId', element.facultyId);
        url.searchParams.set('course', element.course);
        const $button = $('<a>', {
            class: 'col-md-12 col-lg-3 btn btn-primary',
            text: element.name
        });
        $button.attr('href', url);
        $('#faculties').append($('<div>', {class: 'row m-1'}).append($button));
    });
}

async function getGroups(facultyId, course) {
    const apiUrl = new URL(baseUrl + '/rasp/groups');
    apiUrl.searchParams.set('facultyId', facultyId);
    apiUrl.searchParams.set('course', course);
    const response = (await axios.get(apiUrl)).data;

    $('#faculty').text(response.faculty);

    const $courses = $('<div>', {class: 'row'});
    response.courses.forEach(course => {
        let $course = $('<a>', {
            class: 'btn btn-outline-primary w-auto',
            text: course.name
        });
        let url = new URL(window.location.href);
        url.searchParams.set('course', course.course);
        $course.attr('href', url)
        $courses.append($course);
    });
    $('#courses').html($courses);

    $('#groups').html();
    response.groups.forEach(group => {
        let $group = $('<a>', {
            class: 'btn btn-outline-primary w-auto m-1',
            text: group.name
        });
        let url = new URL('http://localhost:3000/schedule.html');
        url.searchParams.set('groupId', group.groupId);
        $group.attr('href', url)
        $('#groups').append($group);
    });
}

function createWeekLink(week) {
    const url = new URL(window.location.href);
    url.searchParams.set('selectedWeek', week);
    const $link = $('<a>', {text: `${week} неделя`, class: 'w-auto'});
    $link.attr('href', url);
    return $link;
}

async function renderGroupSchedule(groupId, selectedWeek) {
    const apiUrl = new URL(baseUrl + '/rasp');
    apiUrl.searchParams.set('groupId', groupId)
    if (selectedWeek !== null) {
        apiUrl.searchParams.set('selectedWeek', selectedWeek)
    }

    try {
        const response = await axios.get(apiUrl);
        render(response.data);
    } catch (err) {
        $('#title').text("Произошла ошибка");
    }
}

async function renderTeacherSchedule(staffId, selectedWeek) {
    const apiUrl = new URL(baseUrl + '/rasp');
    apiUrl.searchParams.set('staffId', staffId)
    if (selectedWeek !== null) {
        apiUrl.searchParams.set('selectedWeek', selectedWeek)
    }
    
    try {
        const response = await axios.get(apiUrl);
        render(response.data);
    } catch (err) {
        $('#title').text("Произошла ошибка");
    }
}

function render(response) {
    if (response.headers.length === 0) {
        $('#title').text('Расписание пока не введено');
        return;
    }

    $('#title').text(response.title);

    $('#weeks-container').html();
    const splittedWeek = response.week.split(' ');
    $('#weeks-container').append(createWeekLink(Number(splittedWeek[0]) - 1));
    $('#weeks-container').append($('<div>', {text: response.week, class: 'w-auto'}));
    $('#weeks-container').append(createWeekLink(Number(splittedWeek[0]) + 1));

    const $tableHeader = $('<tr>');
    $('#schedule-table-head').html();
    response.headers.forEach(header => {
        let $th = $('<th>', {scope: 'col', class: 'text-center align-middle'});
        header.forEach(row => {
            $th.append($('<div>', {text: row}));
        });
        $tableHeader.append($th);
    });
    $('#schedule-table-head').append($tableHeader);

    $('#schedule-table-body').html();
    Object.keys(response.rows).forEach(key => {
        let $tableRow = $('<tr>');
        times = key.split(' - ');
        let $th = $('<th>', {scope: 'row', class: 'text-center align-middle'});
        times.forEach(time => {
            $th.append($('<div>', {text: time}));
        });
        $tableRow.append($th);
        response.rows[key].forEach(elem => {
            let $td = $('<td>', {class: 'text-break p-0'});
            if (elem !== null) {
                elem.forEach((i, index) => {
                    let $div = $('<div>', {class: 'p-1'}).css('font-size', '14px');
                    if (index != 0) {
                        $div.addClass('border-top');
                    }
                    $div.append($('<div>', {text: i.discipline, class: i.type}))
                        .append($('<div>', {text: i.place}).css('font-size', '12px'))
                        .append($('<div>', {text: i.teacher}));
                    let $groups = $('<div>');
                    i.groups.forEach(group => {
                        $groups.append($('<div>', {text: group}));
                    });
                    $div.append($groups);
                    $td.append($div);
                });
            }
            $tableRow.append($td);
        });
        $('#schedule-table-body').append($tableRow);
    });
}

async function searchTeachers(name) {
    if (name.length < 3) {
        return;
    }
    const apiUrl = new URL(baseUrl + '/staff');
    
    const staff = await axios.post(apiUrl, {
        name: name
    });

    $('#staff').html('');
    staff.data.forEach(teacher => {
        const $a = $('<a>', {
            class: 'col-md-12 col-lg-3 btn btn-primary',
            text: teacher.text
        });
        let url = new URL('http://localhost:3000/schedule.html');
        url.searchParams.set('staffId', teacher.id);
        $a.attr('href', url);
        $('#staff').append($('<div>', {class: 'row m-1'}).append($a));
    });
}