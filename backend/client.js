import axios from 'axios';
import { load } from 'cheerio';

const domainUrl = 'https://ssau.ru';
const baseUrl = domainUrl + '/rasp';
const groupsUrl = 'https://ssau.ru/rasp/faculty/';

function parseGroupsUrl(url) {
    let tmp = url.split('/');
    return tmp[3].split('?course=');
}

const lessonTypes = {
    'lesson-type-1__color': 'lecture',
    'lesson-type-3__color': 'practice',
    'lesson-type-2__color': 'lab',
    'lesson-type-5__color': 'exam',
    'lesson-type-8__color': 'test',
    'lesson-type-6__color': 'consultation',
    'lesson-type-4__color': 'other'
}

function parseGroupScheduleUrl(url) {
    let tmp = new URL(url);
    return {'groupId': tmp.searchParams.get('groupId'), 'selectedWeek': tmp.searchParams.get('selectedWeek')}
}

export async function getFaculties() {
    const response = await axios.get(baseUrl);

    const $ = load(response.data);
    const faculties = $('.faculties__item');

    let result = [];
    faculties.each((_, element) => {
        let params = parseGroupsUrl($(element).children()[0].attribs['href'])
        result.push({'name': $(element).text().trim(), 'facultyId': params[0], 'course': params[1]});
    });
    return result;
}

export async function getGroups(facultyId, course) {
    const url = groupsUrl + facultyId + '?course=' + course;

    const response = await axios.get(url);
    const $ = load(response.data);
    const result = {}

    result['faculty'] = $('.h1-text').filter('.page-header').text().trim();
    const courses = [];
    $('.nav-course__item').each((_, element) => {
        let params = parseGroupsUrl($(element).children()[0].attribs['href'])
        courses.push({'name': $(element).text().trim(), 'facultyId': params[0], 'course': params[1]});
    });
    result['courses'] = courses;

    const groups = [];
    $('.group-catalog__group').each((_, element) => {
        let params = parseGroupScheduleUrl(domainUrl + element.attribs['href']);
        groups.push({'name': $(element).text().trim(), 'groupId': params.groupId});
    });
    result['groups'] = groups;
    return result;
}

export async function getGroupSchedule(groupId, weekNumber) {
    let url = baseUrl + '?groupId=' + groupId;
    if (weekNumber !== null && weekNumber !== undefined) {
        url += '&selectedWeek=' + weekNumber
    }

    const response = await axios.get(url);
    const $ = load(response.data);
    const result = {}

    await parseScheduleTable($, result);
    return result;
}

export async function getTeacherSchedule(staffId, weekNumber) {
    let url = baseUrl + '?staffId=' + staffId;
    if (weekNumber !== null && weekNumber !== undefined) {
        url += '&selectedWeek=' + weekNumber
    }

    const response = await axios.get(url);
    const $ = load(response.data);
    const result = {}
    
    await parseScheduleTable($, result);
    return result;
}

async function parseScheduleTable($, result) {
    result['title'] = $('.info-block__title').text().trim();
    result['week'] = $('.week-nav-current_week').text().trim();

    const headers = [];
    const rows = {};
    let row = [];
    let time = [];
    $('.schedule__items').children().each((index, item) => {
        if (index < 7) {
            if ($(item).children().length === 0) {
                headers.push([$(item).text().trim()]);
            } else {
                let header = [];
                $(item).children().each((_, element) => {
                    header.push($(element).text().trim());
                });
                headers.push(header);
            }
        } else {
            if (index % 7 === 0) {
                time = $(item.children.map(child => $(child).text().trim()));
            } else {
                if (item.children.length === 0) {
                    row.push(null)
                } else {
                    let lessons = [];
                    $(item).children().each((_, element) => {
                        let lesson = element.children[1].children[1];
                        let groups = [];
                        let $groups = $(lesson).children('.schedule__groups');
                        if ($groups.length === 0) {
                            $groups = $(lesson).children('.schedule__group');
                        } else {
                            $groups = $groups.children();
                        }
                        $groups.each((_, group) => {
                            groups.push($(group).text().trim());
                        });
                        const lessonType = $(element.children[0]).attr('class').split(' ')[1];
                        lessons.push({
                            'discipline': $(lesson).children('.schedule__discipline').text().trim(),
                            'place': $(lesson).children('.schedule__place').text().trim(),
                            'teacher': $(lesson).children('.schedule__teacher').text().trim(), 
                            'groups': groups,
                            'type': lessonTypes[lessonType]
                        });
                    });
                    row.push(lessons);
                }
                if (index % 7 === 6) {
                    rows[`${time[0]} - ${time[1]}`] = row;
                    time = [];
                    row = [];
                }
            }
        }
    });
    result['headers'] = headers;
    result['rows'] = rows;
}

export async function searchTeachers(name) {
    const tokens = await axios.get(baseUrl);
    const $ = load(tokens.data);

    const csrfToken = $('meta[name="csrf-token"]').attr('content');
    const xsrfToken = tokens.headers['set-cookie'];

    const form = new URLSearchParams();
    form.append('q', name);
    const response = await axios.post(domainUrl + '/staff/staff_search', form, {
        headers: {
            'X-Csrf-Token': csrfToken,
            'Cookie': xsrfToken[0]
        }
    });

    return response.data;
}